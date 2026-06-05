# 修复 Git 推送问题
Set-Location 'C:\Users\37054\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a1c8e309d3f4b1ead45c690\ArbitrageX-new'

# 删除旧的远程引用
Remove-Item -Recurse -Force .git\refs\remotes\origin -ErrorAction SilentlyContinue

# 重新获取远程分支
git fetch origin

# 强制推送本地 main 到远程 main
git push origin main:main --force

Write-Host "推送完成！"
