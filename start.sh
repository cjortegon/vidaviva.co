cd frontend/
lsof -ti:3004 | xargs kill -9 2>/dev/null || true
echo ""
node server.js &
echo "Servidor iniciado en http://localhost:3004"
echo ""
wait
cd ..
