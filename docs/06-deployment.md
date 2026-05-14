# 06 — Deployment

## Ubuntu server

| Thông tin | Giá trị |
|-----------|---------|
| OS | Ubuntu 24.04 LTS |
| LAN IP | 192.168.2.11 |
| Tailscale IP | 100.91.188.83 |

Docker services đang chạy:
- `postgres`
- `adminer`
- `portainer`
- `n8n`
- `open-webui`
- `nginx-proxy-manager`

---

## PM2

Process name: `procurehub`
Port: `3001`

| Lệnh | Tác dụng |
|------|----------|
| `pm2 list` | Xem danh sách process |
| `pm2 restart procurehub --update-env` | Restart + load env mới |
| `pm2 logs procurehub` | Xem logs |

---

## Cloudflare Tunnel

Tunnel name: `homelab`
Config: `/etc/cloudflared/config.yml`

Hostname mappings:
```
n8n.zlab.io.vn      → localhost:5678
ai.zlab.io.vn       → localhost:3000
dauthau.zlab.io.vn  → localhost:3001
```

| Lệnh | Tác dụng |
|------|----------|
| `systemctl status cloudflared` | Kiểm tra trạng thái |
| `sudo systemctl restart cloudflared` | Restart tunnel |

---

## Deploy workflow

### Local development (laptop)
```bash
npm run dev
```

### Push code
```bash
git add .
git commit -m "message"
git push
```

### Deploy production (Ubuntu server)
```bash
cd /data/homelab/apps/procurehub
git pull
npm install
npm run build
pm2 restart procurehub --update-env
```

---

## Debug nhanh

### App không lên
```bash
pm2 list
pm2 logs procurehub
curl http://localhost:3001
```

### Domain không lên
```bash
systemctl status cloudflared
sudo systemctl restart cloudflared
curl -I https://dauthau.zlab.io.vn
```

### API báo thiếu DATABASE_URL
```bash
pm2 restart procurehub --update-env
# Kiểm tra file .env.local trên Ubuntu
```

### localhost có data nhưng domain không có
```bash
curl http://localhost:3001/api/suppliers
curl https://dauthau.zlab.io.vn/api/suppliers
```

Nguyên nhân thường gặp:
- Code production cũ chưa rebuild
- Tunnel route sai
- Thiếu env
- PM2 chưa restart
