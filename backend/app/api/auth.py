# ============================================================
# 认证 API
# 支持邮箱注册/登录、GitHub OAuth、微信 OAuth
# ============================================================
import logging
import secrets
from typing import Optional
from urllib.parse import urlencode

import bcrypt
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_handler import create_access_token
from app.auth.dependencies import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.models.referral import Referral
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    ReferralCodeResponse,
    ReferralStats,
)


def hash_password(password: str) -> str:
    """密码哈希"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["认证"])


# ============================================================
# 邮箱注册 / 登录
# ============================================================


@router.post("/register", response_model=TokenResponse, summary="用户注册")
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    注册新用户（邮箱方式）

    - 支持通过邀请码注册，自动绑定推荐关系
    - 注册成功后自动生成唯一邀请码
    """
    # 检查用户名是否已存在
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在",
        )

    # 检查邮箱是否已存在
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已注册",
        )

    # 查找推荐人
    referred_by: Optional[int] = None
    if user_data.referral_code:
        result = await db.execute(
            select(User).where(User.referral_code == user_data.referral_code)
        )
        referrer = result.scalar_one_or_none()
        if referrer is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邀请码无效",
            )
        referred_by = referrer.id

    # 创建用户
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        referred_by=referred_by,
        balance=10000.0,  # 模拟交易初始余额
        login_method="email",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 创建邀请关系记录
    if referred_by:
        referral = Referral(
            referrer_id=referred_by,
            invitee_id=user.id,
        )
        db.add(referral)
        await db.commit()

    # 生成 JWT 令牌
    token = create_access_token(data={"sub": str(user.id)})

    logger.info(f"新用户注册: {user.username} (ID: {user.id})")

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse, summary="用户登录")
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    用户登录（邮箱方式）

    - 支持用户名或邮箱登录
    - 返回 JWT 令牌
    """
    # 查找用户（支持用户名或邮箱）
    result = await db.execute(
        select(User).where(
            (User.username == login_data.username) | (User.email == login_data.username)
        )
    )
    user = result.scalar_one_or_none()

    if user is None or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    # 生成 JWT 令牌
    token = create_access_token(data={"sub": str(user.id)})

    logger.info(f"用户登录: {user.username} (ID: {user.id})")

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


# ============================================================
# GitHub OAuth2 授权码流程
# ============================================================


@router.get("/github", summary="跳转 GitHub 授权")
async def github_login(request: Request):
    """
    GitHub OAuth 第一步：跳转到 GitHub 授权页面

    用户同意授权后，GitHub 会回调到 callback 端点
    """
    settings = get_settings()

    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth 未配置，请设置 GITHUB_CLIENT_ID",
        )

    # 自动检测当前请求的域名，构建回调地址
    # 这样无论通过哪个域名访问（Railway、Vercel、localhost），都能正确回调
    scheme = request.url.scheme
    host = request.headers.get("host", "")
    callback_url = f"{scheme}://{host}/api/auth/github/callback"

    # 构造 GitHub OAuth 授权 URL
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": callback_url,
        "scope": "read:user,user:email",
        "state": secrets.token_urlsafe(32),  # 防 CSRF
    }

    auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"

    # 将 state 存入 cookie，回调时验证
    request.state.oauth_state = params["state"]

    logger.info(f"GitHub OAuth: 跳转授权, state={params['state'][:8]}...")

    # 使用 RedirectResponse 跳转，同时在 cookie 中保存 state
    response = RedirectResponse(url=auth_url, status_code=307)
    response.set_cookie(
        key="github_oauth_state",
        value=params["state"],
        max_age=600,  # 10分钟有效
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/github/callback", summary="GitHub OAuth 回调")
async def github_callback(
    request: Request,
    code: str = Query(..., description="GitHub 授权码"),
    state: str = Query(..., description="CSRF 状态码"),
    db: AsyncSession = Depends(get_db),
):
    """
    GitHub OAuth 第二步：处理 GitHub 回调

    1. 用授权码换取 access_token
    2. 用 access_token 获取 GitHub 用户信息
    3. 查找或创建本地用户
    4. 返回 JWT 令牌
    """
    settings = get_settings()

    # 验证 state 防 CSRF
    saved_state = request.cookies.get("github_oauth_state")
    if not saved_state or saved_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state 验证失败，请重新登录",
        )

    try:
        # 第一步：用授权码换取 access_token
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                },
                headers={"Accept": "application/json"},
            )
            token_data = token_response.json()

        access_token = token_response.json().get("access_token")
        if not access_token:
            error_desc = token_data.get("error_description", token_data.get("error", "未知错误"))
            logger.error(f"GitHub OAuth 获取 access_token 失败: {error_desc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"GitHub 授权失败: {error_desc}",
            )

        # 第二步：用 access_token 获取 GitHub 用户信息
        async with httpx.AsyncClient(timeout=30.0) as client:
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_response.raise_for_status()
            github_user = user_response.json()

        github_id = github_user.get("id")
        github_username = github_user.get("login", "")
        github_email = github_user.get("email")
        github_avatar = github_user.get("avatar_url", "")

        if not github_id:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="无法获取 GitHub 用户信息",
            )

        # 如果 GitHub 没有返回邮箱，尝试获取公开邮箱
        if not github_email:
            async with httpx.AsyncClient(timeout=30.0) as client:
                emails_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    for email_info in emails:
                        if email_info.get("primary"):
                            github_email = email_info.get("email")
                            break

        # 第三步：查找或创建本地用户
        result = await db.execute(
            select(User).where(User.github_id == github_id)
        )
        user = result.scalar_one_or_none()

        if user is None:
            # 新用户：创建账号
            # 生成唯一的用户名（GitHub 用户名可能已被占用）
            base_username = github_username.lower().replace(" ", "_")[:50]
            username = base_username
            suffix = 1
            while True:
                result = await db.execute(
                    select(User).where(User.username == username)
                )
                if not result.scalar_one_or_none():
                    break
                username = f"{base_username}_{suffix}"
                suffix += 1

            # 生成唯一的邮箱占位符（如果 GitHub 没有提供邮箱）
            if not github_email:
                github_email = f"github_{github_id}@placeholder.local"

            # 检查邮箱是否已被占用
            result = await db.execute(
                select(User).where(User.email == github_email)
            )
            existing_by_email = result.scalar_one_or_none()
            if existing_by_email:
                # 邮箱已被占用，关联 GitHub 账号到已有用户
                existing_by_email.github_id = github_id
                existing_by_email.avatar = github_avatar
                existing_by_email.login_method = "github"
                await db.commit()
                await db.refresh(existing_by_email)
                user = existing_by_email
            else:
                user = User(
                    username=username,
                    email=github_email,
                    password_hash=None,  # OAuth 用户无密码
                    github_id=github_id,
                    avatar=github_avatar,
                    login_method="github",
                    balance=10000.0,  # 模拟交易初始余额
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)

            logger.info(f"GitHub OAuth 新用户: {user.username} (GitHub ID: {github_id})")
        else:
            # 已有用户：更新头像
            if github_avatar:
                user.avatar = github_avatar
            await db.commit()
            await db.refresh(user)

            logger.info(f"GitHub OAuth 用户登录: {user.username} (ID: {user.id})")

        # 第四步：生成 JWT 令牌
        token = create_access_token(data={"sub": str(user.id)})

        # 清除 state cookie，重定向到前端
        # 如果配置了 FRONTEND_URL 则使用它，否则使用当前请求的 Host
        if settings.FRONTEND_URL:
            frontend_url = settings.FRONTEND_URL
        else:
            # 使用当前请求的协议和域名
            scheme = request.url.scheme
            host = request.headers.get("host", "")
            frontend_url = f"{scheme}://{host}"
        
        response = RedirectResponse(
            url=f"{frontend_url}/auth/callback?token={token}&user_id={user.id}",
            status_code=307,
        )
        response.delete_cookie("github_oauth_state")

        return response

    except httpx.HTTPError as e:
        logger.error(f"GitHub OAuth 网络请求失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub 服务连接失败: {str(e)}",
        )


# ============================================================
# 微信开放平台 OAuth2 授权码流程
# ============================================================


@router.get("/wechat", summary="获取微信扫码登录二维码")
async def wechat_login(request: Request):
    """
    微信 OAuth 第一步：生成微信扫码登录二维码 URL

    前端应使用此 URL 生成二维码供用户扫描。
    用户扫码确认后，微信会回调到 callback 端点。
    """
    settings = get_settings()

    if not settings.WECHAT_APP_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="微信登录未配置，请设置 WECHAT_APP_ID",
        )

    # 构造微信扫码登录 URL
    params = {
        "appid": settings.WECHAT_APP_ID,
        "redirect_uri": settings.WECHAT_REDIRECT_URI,
        "response_type": "code",
        "scope": "snsapi_login",
        "state": secrets.token_urlsafe(32),  # 防 CSRF
    }

    qr_url = f"https://open.weixin.qq.com/connect/qrconnect?{urlencode(params)}#wechat_redirect"

    # 将 state 存入 cookie，回调时验证
    response_data = {
        "qr_url": qr_url,
        "state": params["state"],
        "message": "请使用微信扫描二维码登录",
    }

    logger.info(f"微信 OAuth: 生成二维码, state={params['state'][:8]}...")

    # 返回 JSON，前端自行生成二维码
    # 同时在响应中建议前端保存 state
    from fastapi.responses import JSONResponse
    response = JSONResponse(content=response_data)
    response.set_cookie(
        key="wechat_oauth_state",
        value=params["state"],
        max_age=600,  # 10分钟有效
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/wechat/callback", summary="微信 OAuth 回调")
async def wechat_callback(
    request: Request,
    code: str = Query(..., description="微信授权码"),
    state: str = Query(..., description="CSRF 状态码"),
    db: AsyncSession = Depends(get_db),
):
    """
    微信 OAuth 第二步：处理微信回调

    1. 用授权码换取 access_token 和 openid
    2. 用 access_token 获取微信用户信息
    3. 查找或创建本地用户
    4. 返回 JWT 令牌
    """
    settings = get_settings()

    # 验证 state 防 CSRF
    saved_state = request.cookies.get("wechat_oauth_state")
    if not saved_state or saved_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth state 验证失败，请重新登录",
        )

    try:
        # 第一步：用授权码换取 access_token 和 openid
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.get(
                "https://api.weixin.qq.com/sns/oauth2/access_token",
                params={
                    "appid": settings.WECHAT_APP_ID,
                    "secret": settings.WECHAT_APP_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                },
            )
            token_data = token_response.json()

        if "errcode" in token_data and token_data["errcode"] != 0:
            error_msg = token_data.get("errmsg", "未知错误")
            logger.error(f"微信 OAuth 获取 access_token 失败: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"微信授权失败: {error_msg}",
            )

        wechat_access_token = token_data.get("access_token")
        openid = token_data.get("openid")

        if not wechat_access_token or not openid:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="无法获取微信用户凭证",
            )

        # 第二步：用 access_token 获取微信用户信息
        async with httpx.AsyncClient(timeout=30.0) as client:
            user_response = await client.get(
                "https://api.weixin.qq.com/sns/userinfo",
                params={
                    "access_token": wechat_access_token,
                    "openid": openid,
                },
            )
            user_data = user_response.json()

        if "errcode" in user_data and user_data["errcode"] != 0:
            error_msg = user_data.get("errmsg", "未知错误")
            logger.error(f"微信 OAuth 获取用户信息失败: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"获取微信用户信息失败: {error_msg}",
            )

        wechat_nickname = user_data.get("nickname", "")
        wechat_avatar = user_data.get("headimgurl", "")

        # 第三步：查找或创建本地用户
        result = await db.execute(
            select(User).where(User.wechat_openid == openid)
        )
        user = result.scalar_one_or_none()

        if user is None:
            # 新用户：创建账号
            # 生成唯一的用户名
            base_username = f"wx_{openid[:8]}"
            username = base_username
            suffix = 1
            while True:
                result = await db.execute(
                    select(User).where(User.username == username)
                )
                if not result.scalar_one_or_none():
                    break
                username = f"{base_username}_{suffix}"
                suffix += 1

            # 微信用户没有邮箱，使用占位邮箱
            placeholder_email = f"wechat_{openid[:16]}@placeholder.local"

            user = User(
                username=username,
                email=placeholder_email,
                password_hash=None,  # OAuth 用户无密码
                wechat_openid=openid,
                avatar=wechat_avatar,
                login_method="wechat",
                balance=10000.0,  # 模拟交易初始余额
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            logger.info(f"微信 OAuth 新用户: {user.username} (OpenID: {openid[:8]}...)")
        else:
            # 已有用户：更新头像
            if wechat_avatar:
                user.avatar = wechat_avatar
            await db.commit()
            await db.refresh(user)

            logger.info(f"微信 OAuth 用户登录: {user.username} (ID: {user.id})")

        # 第四步：生成 JWT 令牌
        token = create_access_token(data={"sub": str(user.id)})

        # 清除 state cookie，重定向到前端
        if settings.FRONTEND_URL:
            frontend_url = settings.FRONTEND_URL
        else:
            scheme = request.url.scheme
            host = request.headers.get("host", "")
            frontend_url = f"{scheme}://{host}"
        
        response = RedirectResponse(
            url=f"{frontend_url}/auth/callback?token={token}&user_id={user.id}",
            status_code=307,
        )
        response.delete_cookie("wechat_oauth_state")

        return response

    except httpx.HTTPError as e:
        logger.error(f"微信 OAuth 网络请求失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"微信服务连接失败: {str(e)}",
        )


# ============================================================
# 用户信息 / 邀请相关
# ============================================================


@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def get_me(
    user: User = Depends(get_current_user),
):
    """获取当前认证用户的信息"""
    return UserResponse.model_validate(user)


@router.get("/referral-code", response_model=ReferralCodeResponse, summary="获取邀请码")
async def get_referral_code(
    user: User = Depends(get_current_user),
):
    """获取当前用户的邀请码和邀请链接"""
    return ReferralCodeResponse(
        referral_code=user.referral_code,
        referral_link=f"https://arbitragex.app/ref/{user.referral_code}",
    )


@router.get("/referral-stats", response_model=ReferralStats, summary="邀请统计")
async def get_referral_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户的邀请统计数据"""
    # 邀请总人数
    result = await db.execute(
        select(func.count()).select_from(Referral).where(Referral.referrer_id == user.id)
    )
    total_referrals = result.scalar() or 0

    # 有效邀请人数
    result = await db.execute(
        select(func.count()).select_from(Referral).where(
            Referral.referrer_id == user.id,
            Referral.status == "active",
        )
    )
    active_referrals = result.scalar() or 0

    # 累计佣金
    result = await db.execute(
        select(func.coalesce(func.sum(Referral.commission), 0)).where(
            Referral.referrer_id == user.id,
        )
    )
    total_commission = result.scalar() or 0

    return ReferralStats(
        total_referrals=total_referrals,
        total_commission=total_commission,
        active_referrals=active_referrals,
        commission_balance=user.commission_balance,
    )
