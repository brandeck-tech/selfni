#!/data/data/com.termux/files/usr/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

clear
printf "${PURPLE}${BOLD}"
printf "  ███████╗███████╗██╗     ███████╗██╗\n"
printf "  ██╔════╝██╔════╝██║     ██╔════╝██║\n"
printf "  ███████╗█████╗  ██║     █████╗  ██║\n"
printf "  ╚════██║██╔══╝  ██║     ██╔══╝  ██║\n"
printf "  ███████║███████╗███████╗██║     ██║\n"
printf "  ╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝\n"
printf "${NC}${CYAN}     نظام إدارة الديون الذكي\n${NC}\n"

# 1. شغل PostgreSQL
printf "  ${YELLOW}[1/3] تشغيل قاعدة البيانات...${NC}\n"
pg_ctl start -D $PREFIX/var/lib/postgresql > /dev/null 2>&1
sleep 2

# 2. اقتل أي processes قديمة
pkill -9 -f "tsx src/index.ts" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
# اقتل أي حاجة على البورتات
OLDPID=$(lsof -ti :3003 2>/dev/null)
[ -n "$OLDPID" ] && kill -9 $OLDPID 2>/dev/null
OLDPID=$(lsof -ti :5173 2>/dev/null)
[ -n "$OLDPID" ] && kill -9 $OLDPID 2>/dev/null
sleep 1

# 3. شغل Backend
printf "  ${YELLOW}[2/3] تشغيل Backend...${NC}\n"
cd /data/data/com.termux/files/home/selfni-full/backend
npm run dev > /data/data/com.termux/files/home/selfni-back.log 2>&1 &
BACKEND_PID=$!
sleep 5

# 4. شغل Frontend
printf "  ${YELLOW}[3/3] تشغيل Frontend...${NC}\n"
cd /data/data/com.termux/files/home/selfni-full/frontend
npm run dev -- --host > /data/data/com.termux/files/home/selfni-front.log 2>&1 &
FRONTEND_PID=$!
printf "  انتظر...\n"
sleep 15

# 5. فحص الحالة
BACKEND_STATUS="DOWN"
curl -s http://localhost:3003/health > /dev/null 2>&1 && BACKEND_STATUS="UP"

FRONTEND_STATUS="DOWN"
curl -s http://localhost:5173 > /dev/null 2>&1 && FRONTEND_STATUS="UP"

pg_isready -h localhost -p 5432 -q 2>/dev/null
if [ $? -eq 0 ]; then
  DB_STATUS="UP"
  DB_COUNT=$(psql -h localhost -U postgres -d selfni -tAc "SELECT COUNT(*) FROM debts" 2>/dev/null || echo "?")
else
  DB_STATUS="DOWN"
  DB_COUNT="0"
fi
IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP "src \K\S+" || echo "localhost")

# 6. عرض النتيجة
clear
printf "${PURPLE}${BOLD}"
printf "  ███████╗███████╗██╗     ███████╗██╗\n"
printf "  ██╔════╝██╔════╝██║     ██╔════╝██║\n"
printf "  ███████╗█████╗  ██║     █████╗  ██║\n"
printf "  ╚════██║██╔══╝  ██║     ██╔══╝  ██║\n"
printf "  ███████║███████╗███████╗██║     ██║\n"
printf "  ╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝\n"
printf "${NC}${CYAN}     نظام إدارة الديون الذكي\n${NC}\n"

printf "  ${BOLD}━━━━━━━━━ حالة الخدمات ━━━━━━━━━${NC}\n\n"

if [ "$DB_STATUS" = "UP" ]; then
  printf "  🟢  PostgreSQL   ${GREEN}شغال${NC}  ← ${DB_COUNT} ديون\n"
else
  printf "  🔴  PostgreSQL   ${RED}متوقف${NC}\n"
fi

if [ "$BACKEND_STATUS" = "UP" ]; then
  printf "  🟢  Backend API  ${GREEN}شغال${NC}  ← :3003\n"
else
  printf "  🔴  Backend API  ${RED}متوقف${NC}  ← :3003\n"
  printf "      $(tail -3 /data/data/com.termux/files/home/selfni-back.log 2>/dev/null | head -1)\n"
fi

if [ "$FRONTEND_STATUS" = "UP" ]; then
  printf "  🟢  Frontend     ${GREEN}شغال${NC}  ← :5173\n"
else
  printf "  🔴  Frontend     ${RED}متوقف${NC}  ← :5173\n"
fi

printf "\n  ${BOLD}━━━━━━━━━━ الروابط ━━━━━━━━━━━${NC}\n\n"
printf "  📱  http://${IP}:5173\n"
printf "  🔧  http://localhost:3003\n"
printf "\n  ${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "\n  ${YELLOW}Ctrl+C للإيقاف${NC}\n\n"

cleanup() {
  printf "\n  ${RED}جاري الإيقاف...${NC}\n"
  pkill -9 -f "tsx src/index.ts" 2>/dev/null
  pkill -9 -f "vite" 2>/dev/null
  printf "  ${GREEN}تم ✓${NC}\n"
  exit 0
}
trap cleanup INT TERM

# راقب الـ logs
tail -f /data/data/com.termux/files/home/selfni-back.log /data/data/com.termux/files/home/selfni-front.log 2>/dev/null | grep --line-buffered -E "(rror|✅|🚀|ready in|VITE v)" &

wait $BACKEND_PID $FRONTEND_PID
