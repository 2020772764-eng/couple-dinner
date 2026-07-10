@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   今晚吃什么 - GitHub Pages 一键部署
echo ============================================
echo.

REM 检查 git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Git，请先安装 Git
    pause
    exit /b 1
)

REM 检查是否已初始化
if not exist ".git" (
    echo [1/4] 初始化 Git 仓库...
    git init
    git add -A
    git commit -m "初始化：情侣点餐 PWA"
) else (
    echo [1/4] Git 仓库已存在
    git add -A
    git commit -m "更新部署" 2>nul
)

REM 创建 GitHub 仓库（如果不存在）
echo [2/4] 创建/连接 GitHub 仓库...
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo 请先在浏览器中登录 GitHub...
    gh auth login --web --hostname github.com
)

REM 获取当前用户名
for /f "delims=" %%i in ('gh api user --jq ".login" 2^>nul') do set GH_USER=%%i
if "%GH_USER%"=="" set GH_USER=2020772764-eng

gh repo view %GH_USER%/couple-dinner >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在创建仓库 couple-dinner...
    gh repo create couple-dinner --public --description "情侣点餐 PWA - 今晚吃什么" -y
)

REM 设置 remote 并推送
echo [3/4] 推送代码到 GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/%GH_USER%/couple-dinner.git
git push -u origin master --force

if %errorlevel% neq 0 (
    echo [错误] 推送失败，请检查网络或 GitHub 登录状态
    pause
    exit /b 1
)

REM 启用 GitHub Pages
echo [4/4] 启用 GitHub Pages...
gh api -X POST /repos/%GH_USER%/couple-dinner/pages -F "source[branch]=master" -F "source[path]=/" >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] Pages 可能已启用或需手动开启
)

echo.
echo ============================================
echo   ✅ 部署完成！
echo.
echo   🔗 https://%GH_USER%.github.io/couple-dinner/
echo.
echo   等 30 秒后访问上面的链接即可
echo ============================================
pause
