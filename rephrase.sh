#!/bin/bash

# RePhraseAI Launcher Script
# Manages frontend and backend servers using tmux

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SESSION_NAME="rephrase"
BACKEND_DIR="/Users/jp/Code/RePhraseAI/backend"
FRONTEND_DIR="/Users/jp/Code/RePhraseAI/frontend"
BACKEND_PORT="5001"
FRONTEND_PORT="5173"

# Helper function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if tmux is installed
check_tmux() {
    if ! command -v tmux &> /dev/null; then
        print_error "tmux is not installed"
        echo ""
        read -p "Would you like to install tmux now? [y/n]: " install_choice
        if [[ $install_choice == "y" || $install_choice == "Y" ]]; then
            print_info "Installing tmux..."
            brew install tmux
            if [ $? -eq 0 ]; then
                print_success "tmux installed successfully"
            else
                print_error "Failed to install tmux"
                exit 1
            fi
        else
            print_error "tmux is required to run this script"
            exit 1
        fi
    fi
}

# Check if session is running
is_running() {
    tmux has-session -t "$SESSION_NAME" 2>/dev/null
}

# Start servers
start_servers() {
    echo ""
    echo "╔════════════════════════════════╗"
    echo "║   Starting RePhraseAI...       ║"
    echo "╚════════════════════════════════╝"
    echo ""

    if is_running; then
        print_warning "Servers are already running"
        print_info "Use './rephrase.sh stop' to stop them first"
        print_info "Or use './rephrase.sh reconnect' to attach"
        exit 1
    fi

    print_info "Starting backend on http://localhost:${BACKEND_PORT}"
    print_info "Starting frontend on http://localhost:${FRONTEND_PORT}"
    echo ""

    # Create new tmux session with backend
    tmux new-session -d -s "$SESSION_NAME" -n "RePhraseAI" -c "$BACKEND_DIR"
    tmux send-keys -t "$SESSION_NAME" "source venv/bin/activate && python3 app.py" C-m

    # Split window and start frontend
    tmux split-window -t "$SESSION_NAME" -h -c "$FRONTEND_DIR"
    tmux send-keys -t "$SESSION_NAME" "npm run dev" C-m

    # Adjust pane sizes (50/50 split)
    tmux select-layout -t "$SESSION_NAME" even-horizontal

    sleep 2

    print_success "Servers started successfully"
    echo ""
    print_info "Backend:  http://localhost:${BACKEND_PORT}"
    print_info "Frontend: http://localhost:${FRONTEND_PORT}"
    echo ""
    print_info "Attaching to session (press Ctrl+B then D to detach)..."
    sleep 1

    # Attach to session
    tmux attach -t "$SESSION_NAME"
}

# Stop servers
stop_servers() {
    echo ""
    print_info "Stopping RePhraseAI servers..."

    if ! is_running; then
        print_warning "Servers are not running"
        exit 0
    fi

    tmux kill-session -t "$SESSION_NAME"

    if [ $? -eq 0 ]; then
        print_success "Servers stopped successfully"
    else
        print_error "Failed to stop servers"
        exit 1
    fi
    echo ""
}

# Restart servers
restart_servers() {
    echo ""
    print_info "Restarting RePhraseAI servers..."
    echo ""

    if is_running; then
        stop_servers
        sleep 2
    fi

    start_servers
}

# Show status
show_status() {
    echo ""
    echo "╔════════════════════════════════╗"
    echo "║   RePhraseAI Status            ║"
    echo "╚════════════════════════════════╝"
    echo ""

    if is_running; then
        print_success "RePhraseAI is running"
        echo ""
        print_info "Backend:  http://localhost:${BACKEND_PORT}"
        print_info "Frontend: http://localhost:${FRONTEND_PORT}"
        echo ""

        # Show tmux session info
        panes=$(tmux list-panes -t "$SESSION_NAME" | wc -l)
        print_info "Session:  $SESSION_NAME ($panes panes)"
        echo ""
        echo "Available commands:"
        echo "  ./rephrase.sh reconnect  - Attach to running session"
        echo "  ./rephrase.sh logs       - View server logs"
        echo "  ./rephrase.sh stop       - Stop servers"
    else
        print_warning "RePhraseAI is not running"
        echo ""
        echo "Start servers with:"
        echo "  ./rephrase.sh start"
    fi
    echo ""
}

# Reconnect to session
reconnect() {
    echo ""
    if ! is_running; then
        print_error "Servers are not running"
        print_info "Start servers with: ./rephrase.sh start"
        exit 1
    fi

    print_info "Reconnecting to session (press Ctrl+B then D to detach)..."
    sleep 1
    tmux attach -t "$SESSION_NAME"
}

# View logs
view_logs() {
    echo ""
    if ! is_running; then
        print_error "Servers are not running"
        print_info "Start servers with: ./rephrase.sh start"
        exit 1
    fi

    print_info "Viewing logs (press Ctrl+B then D to detach)..."
    sleep 1
    tmux attach -t "$SESSION_NAME"
}

# Show interactive menu
show_menu() {
    echo ""
    echo "╔════════════════════════════════╗"
    echo "║    RePhraseAI Launcher         ║"
    echo "╚════════════════════════════════╝"
    echo ""
    echo "1. Start servers"
    echo "2. Stop servers"
    echo "3. Restart servers"
    echo "4. Reconnect to session"
    echo "5. Show status"
    echo "6. View logs"
    echo "7. Exit"
    echo ""
    read -p "Choose option [1-7]: " choice

    case $choice in
        1) start_servers ;;
        2) stop_servers ;;
        3) restart_servers ;;
        4) reconnect ;;
        5) show_status ;;
        6) view_logs ;;
        7) echo ""; print_info "Goodbye!"; echo ""; exit 0 ;;
        *) print_error "Invalid option"; exit 1 ;;
    esac
}

# Main script logic
main() {
    # Check tmux installation
    check_tmux

    # If no arguments, show menu
    if [ $# -eq 0 ]; then
        show_menu
        exit 0
    fi

    # Handle command-line arguments
    case "$1" in
        start)
            start_servers
            ;;
        stop)
            stop_servers
            ;;
        restart)
            restart_servers
            ;;
        status)
            show_status
            ;;
        reconnect)
            reconnect
            ;;
        logs)
            view_logs
            ;;
        help|--help|-h)
            echo ""
            echo "Usage: $0 [COMMAND]"
            echo ""
            echo "Commands:"
            echo "  start      Start backend and frontend servers"
            echo "  stop       Stop all servers"
            echo "  restart    Restart all servers"
            echo "  status     Show server status"
            echo "  reconnect  Reconnect to running session"
            echo "  logs       View server logs"
            echo "  help       Show this help message"
            echo ""
            echo "Run without arguments for interactive menu"
            echo ""
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
