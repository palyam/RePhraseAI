# RePhraseAI Launcher Guide

## Quick Start

### Start the app:
```bash
./rephrase.sh start
```

### Stop the app:
```bash
./rephrase.sh stop
```

### Restart the app:
```bash
./rephrase.sh restart
```

### Check status:
```bash
./rephrase.sh status
```

---

## All Available Commands

| Command | Description |
|---------|-------------|
| `./rephrase.sh start` | Start backend and frontend servers |
| `./rephrase.sh stop` | Stop all servers |
| `./rephrase.sh restart` | Restart all servers |
| `./rephrase.sh status` | Show server status |
| `./rephrase.sh reconnect` | Reconnect to running session |
| `./rephrase.sh logs` | View server logs |
| `./rephrase.sh help` | Show help message |
| `./rephrase.sh` | Interactive menu |

---

## Usage Examples

### Starting Servers

```bash
./rephrase.sh start
```

You'll see:
```
╔════════════════════════════════╗
║   Starting RePhraseAI...       ║
╚════════════════════════════════╝

ℹ Starting backend on http://localhost:5001
ℹ Starting frontend on http://localhost:5173

✓ Servers started successfully

ℹ Backend:  http://localhost:5001
ℹ Frontend: http://localhost:5173

ℹ Attaching to session (press Ctrl+B then D to detach)...
```

The terminal splits into two panes:
- **Left pane:** Backend (Flask) server logs
- **Right pane:** Frontend (Vite) server logs

### Detaching from Session

Once servers are running, you can detach and leave them running:

1. Press `Ctrl+B`
2. Then press `D`

Your terminal closes, but **servers keep running in the background**!

### Reconnecting to Session

To see the logs again:
```bash
./rephrase.sh reconnect
```

Or:
```bash
./rephrase.sh logs
```

### Stopping Servers

```bash
./rephrase.sh stop
```

Output:
```
ℹ Stopping RePhraseAI servers...
✓ Servers stopped successfully
```

### Checking Status

```bash
./rephrase.sh status
```

**When running:**
```
╔════════════════════════════════╗
║   RePhraseAI Status            ║
╚════════════════════════════════╝

✓ RePhraseAI is running

ℹ Backend:  http://localhost:5001
ℹ Frontend: http://localhost:5173

ℹ Session:  rephrase (2 panes)

Available commands:
  ./rephrase.sh reconnect  - Attach to running session
  ./rephrase.sh logs       - View server logs
  ./rephrase.sh stop       - Stop servers
```

**When not running:**
```
⚠ RePhraseAI is not running

Start servers with:
  ./rephrase.sh start
```

---

## tmux Keyboard Shortcuts

While attached to the session:

### Navigation
- `Ctrl+B` then `→` - Move to right pane
- `Ctrl+B` then `←` - Move to left pane

### Scrolling
- `Ctrl+B` then `[` - Enter scroll mode
  - Use arrow keys or Page Up/Down to scroll
  - Press `q` to exit scroll mode

### Session Management
- `Ctrl+B` then `D` - Detach (servers keep running)
- `Ctrl+B` then `x` - Kill current pane (confirm with `y`)
- `Ctrl+B` then `?` - Show all tmux shortcuts

---

## Interactive Menu

Run without arguments to see the interactive menu:

```bash
./rephrase.sh
```

Menu:
```
╔════════════════════════════════╗
║    RePhraseAI Launcher         ║
╚════════════════════════════════╝

1. Start servers
2. Stop servers
3. Restart servers
4. Reconnect to session
5. Show status
6. View logs
7. Exit

Choose option [1-7]:
```

---

## Typical Workflow

### Daily Usage:

1. **Morning:** Start servers
   ```bash
   ./rephrase.sh start
   ```

2. **Detach and work:** Press `Ctrl+B D`

3. **Need to check logs?** Reconnect anytime
   ```bash
   ./rephrase.sh reconnect
   ```

4. **End of day:** Stop servers
   ```bash
   ./rephrase.sh stop
   ```

### Development Workflow:

1. **Start servers:**
   ```bash
   ./rephrase.sh start
   ```

2. **Make code changes** (servers auto-reload)

3. **Need to restart?**
   ```bash
   ./rephrase.sh restart
   ```

4. **Check if running:**
   ```bash
   ./rephrase.sh status
   ```

---

## Troubleshooting

### Servers won't start

**Check if already running:**
```bash
./rephrase.sh status
```

**If running, stop first:**
```bash
./rephrase.sh stop
./rephrase.sh start
```

### Port already in use

If you see errors about port 5001 or 5173 being in use:

```bash
# Stop any existing servers
./rephrase.sh stop

# Check for rogue processes
lsof -ti:5001
lsof -ti:5173

# Kill them if needed
lsof -ti:5001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Start fresh
./rephrase.sh start
```

### tmux session is stuck

```bash
# Force kill the session
tmux kill-session -t rephrase

# Start fresh
./rephrase.sh start
```

### Can't connect to backend

1. Check if backend is running:
   ```bash
   ./rephrase.sh status
   ```

2. Visit backend directly:
   ```bash
   curl http://localhost:5001/api/models
   ```

3. Restart servers:
   ```bash
   ./rephrase.sh restart
   ```

---

## Benefits of Using This Launcher

✅ **Simple** - One command to start/stop everything
✅ **Persistent** - Servers survive terminal close
✅ **Organized** - See both logs side-by-side
✅ **Fast** - No need to open multiple terminals
✅ **Professional** - Like running any other app
✅ **Detachable** - Work on other things while servers run

---

## Access the Application

Once servers are running:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001
- **API Models:** http://localhost:5001/api/models
- **API Styles:** http://localhost:5001/api/styles

---

## Notes

- The script automatically installs `tmux` if not present
- Servers run in a tmux session named "rephrase"
- Backend runs in the left pane, frontend in the right pane
- Both servers auto-reload when you make code changes
- Logs are visible in real-time in each pane
