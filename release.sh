#!/bin/bash

# 词达人 App 自动发布脚本
# 使用方法: ./release.sh [version]
# 例如: ./release.sh 1.0.1

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否在 git 仓库中
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "当前目录不是 git 仓库"
        exit 1
    fi
}

# 检查工作区是否干净
check_clean_workdir() {
    if ! git diff --quiet || ! git diff --cached --quiet; then
        print_warn "工作区有未提交的更改"
        read -p "是否继续？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 获取版本号
get_version() {
    if [ -n "$1" ]; then
        VERSION=$1
    else
        # 从 app.json 获取当前版本
        VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
        print_info "当前版本: $VERSION"
        read -p "请输入新版本号 (回车保持当前版本): " NEW_VERSION
        if [ -n "$NEW_VERSION" ]; then
            VERSION=$NEW_VERSION
        fi
    fi
    print_info "发布版本: v$VERSION"
}

# 更新版本号
update_version() {
    print_info "更新 app.json 版本号..."

    # 使用 sed 更新版本号
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" app.json
    else
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" app.json
    fi

    print_info "版本号已更新为 $VERSION"
}

# 拉取最新代码
pull_code() {
    print_info "拉取最新代码..."
    git pull origin main
}

# 提交更改
commit_changes() {
    print_info "提交更改..."

    # 检查是否有更改
    if ! git diff --quiet || ! git diff --cached --quiet; then
        git add .
        git commit -m "chore: 发布 v$VERSION"
        print_info "更改已提交"
    else
        print_info "没有需要提交的更改"
    fi
}

# 推送代码
push_code() {
    print_info "推送代码到远程..."
    git push origin main
}

# 创建 tag
create_tag() {
    print_info "创建 tag v$VERSION..."

    # 删除同名 tag（如果存在）
    git tag -d "v$VERSION" 2>/dev/null || true
    git push origin :refs/tags/"v$VERSION" 2>/dev/null || true

    # 创建新 tag
    git tag -a "v$VERSION" -m "Release v$VERSION"

    # 推送 tag
    git push origin "v$VERSION"

    print_info "Tag v$VERSION 已创建并推送"
}

# 显示完成信息
show_complete() {
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  发布完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "版本: ${YELLOW}v$VERSION${NC}"
    echo -e "Tag: ${YELLOW}v$VERSION${NC}"
    echo
    echo -e "GitHub Actions 正在构建中..."
    echo -e "查看构建状态: ${YELLOW}https://github.com/6634284/vocab-app/actions${NC}"
    echo
    echo -e "构建完成后，APK 将发布到:"
    echo -e "${YELLOW}https://github.com/6634284/vocab-app/releases${NC}"
    echo
}

# 主函数
main() {
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  词达人 App 自动发布脚本${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo

    # 检查
    check_git_repo
    check_clean_workdir

    # 获取版本号
    get_version "$1"

    # 确认发布
    read -p "确认发布 v$VERSION？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warn "发布已取消"
        exit 0
    fi

    # 执行发布流程
    update_version
    pull_code
    commit_changes
    push_code
    create_tag

    # 显示完成信息
    show_complete
}

# 运行主函数
main "$@"
