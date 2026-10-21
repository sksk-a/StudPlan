# Развёртывание СтудПлана на Ubuntu 24.04 LTS

Статус на 20.10.2026: подготовлены файлы и инструкция. VPS не приобретался, удалённый сервер не настраивался. Docker отсутствует в локальном окружении, поэтому контейнерная сборка и запуск ещё требуют проверки. Результаты локальных проверок Node.js и PostgreSQL кратко приведены в README.md.

## 1. Выбор VPS

Самостоятельно выберите провайдера и создайте VPS с Ubuntu 24.04 LTS, архитектурой amd64, публичным IPv4, доступом по SSH и консолью восстановления. Для учебного запуска ориентир: 2 vCPU, 2–4 ГБ RAM, 25–40 ГБ SSD; сборка frontend требует дополнительной памяти. Это оценка ресурсов, нагрузочные измерения не проводились. Проверьте стоимость, регион, лимиты трафика, возможность резервного копирования и правила провайдера. Здесь нет рекомендации конкретного тарифа или обещания производительности. Домен понадобится позднее для публичного HTTPS.

В командах ниже `SERVER_IP` и `YOUR_DOMAIN` — обозначения, которые нужно заменить собственными значениями. Они не являются выданными сервером реквизитами.

## 2. SSH из Windows

Откройте PowerShell. Проверьте `ssh -V`, при отсутствии установите компонент Windows «Клиент OpenSSH». Создайте ключ, задав парольную фразу:

```powershell
ssh-keygen -t ed25519 -C "studplan-vps"
Get-Content "$env:USERPROFILE/.ssh/id_ed25519.pub"
ssh root@SERVER_IP
```

Если ключ уже есть, используйте его либо другое имя файла; существующий не перезаписывайте. Публичный ключ добавьте при создании VPS. Приватный ключ никому не передавайте. Сверьте отпечаток SSH с консолью провайдера перед первым подключением.

Следующие команды выполняются **в Ubuntu по SSH**, если не указано иное:

```bash
apt update
apt upgrade -y
apt install -y sudo git curl ufw ca-certificates openssl
adduser deploy
usermod -aG sudo deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Если ключ был установлен в другом аккаунте, скопируйте именно свой публичный ключ в `/home/deploy/.ssh/authorized_keys`. Во **втором окне Windows** убедитесь, что работает `ssh deploy@SERVER_IP`, затем `sudo -v`. Первое соединение пока оставьте открытым.

Создайте через `sudo nano /etc/ssh/sshd_config.d/00-studplan.conf`:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

Проверьте `sudo sshd -t` и эффективные настройки `sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication'`. Настройки провайдера и секции Match могут влиять на результат. Только после проверки ключевого входа выполните `sudo systemctl reload ssh` и ещё раз подключитесь новым окном. При ошибке исправляйте из оставленного окна или консоли провайдера.

## 3. Брандмауэр и обновления

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Если SSH использует другой порт, разрешите его **до** включения UFW. В сетевом firewall провайдера оставьте входящие TCP 80/443 для сайта и SSH только с вашего IP, если он постоянный. Порты 3001, 5432 и 2019 публиковать не нужно. Docker публикует порты в обход части правил UFW: здесь наружу опубликован только Caddy. Ограничения для Docker задавайте также у провайдера или через DOCKER-USER; не отключайте управление iptables у Docker. [Официальное объяснение Docker](https://docs.docker.com/engine/network/packet-filtering-firewalls/).

## 4. Установка Docker Engine и Compose

На новой Ubuntu, без конфликтующих пакетов Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

При уже установленном Docker сначала проверьте конфликтующие пакеты по [официальной инструкции](https://docs.docker.com/engine/install/ubuntu/). Все последующие команды используют `sudo docker`, поэтому добавление deploy в привилегированную группу docker не требуется. Доступ к Docker фактически позволяет получить права root.

## 5. Загрузка подготовленной версии

Из Windows можно передать **текущие локальные коммиты без push**:

```powershell
Set-Location C:\Users\Administrator\Desktop\aa\StudPlan
git bundle create .local/studplan.bundle --all
scp .local/studplan.bundle deploy@SERVER_IP:/home/deploy/studplan.bundle
```

На VPS:

```bash
sudo mkdir -p /opt/studplan
sudo chown deploy:deploy /opt/studplan
git clone ~/studplan.bundle /opt/studplan
cd /opt/studplan
git log -3 --oneline
```

Проверьте, что виден последний коммит подготовки практических. Альтернатива: после отдельно разрешённого вами push клонировать `https://github.com/sksk-a/StudPlan.git`. Обычный clone с GitHub до push не содержит подготовленных здесь файлов. Bundle не включает игнорируемые `.env`, базу и node_modules.

## 6. Настройки окружения и проверка по IP

```bash
cd /opt/studplan
cp .env.example .env
chmod 600 .env
openssl rand -hex 32
openssl rand -hex 48
nano .env
```

Первую случайную строку вставьте в POSTGRES_PASSWORD, вторую — в JWT_SECRET. Не оставляйте REPLACE_WITH. Значения не публикуйте и не фотографируйте. Для POSTGRES_PASSWORD используйте hex без специальных символов, поскольку он включается в URL подключения. POSTGRES_USER и POSTGRES_DB оставьте как в примере: латинские буквы и подчёркивания.

Для первого запуска задайте `SITE_ADDRESS=:80`, `CLIENT_ORIGIN=http://SERVER_IP`, `HTTP_PORT=80`, `HTTPS_PORT=443`. В CLIENT_ORIGIN замените SERVER_IP, не добавляйте завершающий `/`. Корневой `.env` предназначен Compose; `server/.env` используется только при локальном запуске Node.js и в Docker не копируется. В контейнерах переменные передаются непосредственно.

```bash
sudo docker compose config --quiet
sudo docker compose up -d --build
sudo docker compose ps -a
sudo docker compose logs --tail=100 migrate backend frontend
curl --fail http://127.0.0.1/api/health
```

Ожидается: migrate завершился с кодом 0, db/backend/frontend получили healthy, health вернул `{"status":"ok"}`. Это **ожидаемые критерии**, а не уже полученные результаты VPS. Миграции применяются отдельным сервисом перед backend. `restart: unless-stopped` возвращает постоянные сервисы после падения процесса и перезагрузки ОС. Сам статус unhealthy не вызывает автоматический перезапуск.

Откройте `http://SERVER_IP` в Windows. Проверка по HTTP — временная, не используйте реальные пароли до HTTPS. Зарегистрируйте учебную учётную запись, добавьте предмет и задачу, обновите страницу, завершите и удалите задачу. Проверьте прямой переход на `/tasks`: SPA должен открываться после обновления. Убедитесь, что `http://SERVER_IP:3001` и порт 5432 недоступны снаружи. Не запускайте seed на публичной базе: он создаёт общеизвестный demo-пароль.

База использует постоянный volume postgres_data и ICU ru-RU для регистронезависимого поиска русских названий. POSTGRES_INITDB_ARGS применяется только при **первой** инициализации пустого volume. При существующей БД с неподходящей локалью сначала сделайте backup и планируйте перенос в новую БД, не удаляйте volume ради исправления поиска. POSTGRES_USER начального образа имеет административные права внутри БД; для эксплуатации с повышенными требованиями стоит отдельно выдать приложению ограниченную роль, а миграциям — DDL-права. Сейчас разделение ролей не реализовано.

## 7. Домен и HTTPS

Самостоятельно зарегистрируйте домен и создайте A-запись на реальный IPv4 сервера. AAAA добавляйте только при работающем IPv6. Проверьте из Windows `Resolve-DnsName YOUR_DOMAIN`. В `.env` замените SITE_ADDRESS на домен **без протокола и пути**, CLIENT_ORIGIN на `https://YOUR_DOMAIN`.

```bash
sudo docker compose up -d --force-recreate frontend backend
sudo docker compose logs --tail=100 frontend
curl --fail https://YOUR_DOMAIN/api/health
curl -I http://YOUR_DOMAIN
```

Caddy автоматически получает и продлевает публичный сертификат через ACME (обычно Let's Encrypt, возможен резервный центр), перенаправляет HTTP на HTTPS. Требуются правильный DNS, доступные 80/443, исходящий интернет и постоянный volume caddy_data. Не включайте `tls internal` для публичного домена. На IP-этапе HTTPS не заявляется. Проверьте издателя и срок сертификата в браузере. [Документация автоматического HTTPS](https://caddyserver.com/docs/automatic-https).

## 8. Логи и мониторинг

```bash
sudo docker compose ps -a
sudo docker compose logs --tail=100 backend
sudo docker compose logs -f --tail=100 frontend
sudo docker stats --no-stream
df -h
free -h
sudo env MONITOR_URL=https://YOUR_DOMAIN sh scripts/monitor.sh
```

На IP-этапе задайте MONITOR_URL=http://SERVER_IP. Скрипт проверяет публичный API вместе с БД, health всех постоянных сервисов и заполнение диска менее 85%; ненулевой код означает проблему. Frontend health проверяет локальный Caddy admin API; доступность всей цепочки проверяет именно monitor.sh. Админ-порт 2019 наружу не публикуется. Логи Caddy JSON и ошибки Node идут в stdout/stderr, Docker хранит по 3 файла до 10 МБ на сервис. JWT, пароли и тела запросов в журнал намеренно не добавляются. Логи доступа всё же содержат адреса клиентов и URL — ограничивайте доступ.

Для периодической проверки откройте `sudo crontab -e`, добавьте (заменив URL):

```cron
*/5 * * * * MONITOR_URL=https://YOUR_DOMAIN /bin/sh /opt/studplan/scripts/monitor.sh 2>&1 | /usr/bin/logger -t studplan-monitor
15 2 * * * /bin/sh /opt/studplan/scripts/backup.sh 2>&1 | /usr/bin/logger -t studplan-backup
```

Просмотр: `sudo journalctl -t studplan-monitor -t studplan-backup --since today`. Это журнал, не система уведомлений: внешний контроль доступности и канал оповещений нужно настроить отдельно. Для проверки самого мониторинга временно остановите backend в учебное окно, убедитесь в ошибке monitor.sh и затем запустите `sudo docker compose up -d backend`. Не называйте одиночный VPS отказоустойчивым кластером.

## 9. Резервное копирование и восстановление

```bash
sudo sh scripts/backup.sh
sudo ls -lh backups
```

Скрипт делает согласованный pg_dump в custom-формате, пишет сначала `.partial`, устанавливает доступ только владельцу. Каталог backups игнорируется Git. Перенесите копию на другой носитель/сервер, иначе потеря VPS уничтожит и рабочую БД, и копии. Например, на VPS подготовьте доступную deploy копию только для конкретного файла через `sudo install -m 600 -o deploy -g deploy backups/ACTUAL_FILE.dump /home/deploy/ACTUAL_FILE.dump`, затем на Windows `scp deploy@SERVER_IP:/home/deploy/ACTUAL_FILE.dump .` и удалите промежуточный файл после проверки. ACTUAL_FILE заменяется реальным именем. Копии содержат персональные данные и хэши: храните их в зашифрованном хранилище. Удаление старых копий вручную после проверки внешних; ориентир хранения 7 ежедневных и 4 еженедельных, автоматическая ротация здесь не настроена.

Сначала проверьте восстановление **в отдельную базу**, без изменения рабочей:

```bash
sudo docker compose exec db sh -c 'createdb -U "$POSTGRES_USER" -T template0 --locale-provider=icu --icu-locale=ru-RU studplan_restore_check'
sudo docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d studplan_restore_check --no-owner --no-acl --exit-on-error' < backups/ACTUAL_FILE.dump
sudo docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d studplan_restore_check -c '\''SELECT COUNT(*) FROM "Task";'\'''
```

Проверьте ожидаемые количества и связи. Для аварийного восстановления рабочей базы сначала остановите backend и сделайте ещё одну копию текущего состояния; переключение на проверенную восстановленную базу выполняйте отдельной процедурой. Не применяйте разрушительный restore к рабочей БД ради демонстрации.

## 10. Обновление, откат и завершение защиты

Перед обновлением: backup, запись `git rev-parse HEAD`, просмотр миграций. Получите новую разрешённую версию через Git или bundle. Выполните `sudo docker compose stop backend`, `sudo docker compose build`, затем `sudo docker compose run --rm migrate` и только после успеха `sudo docker compose up -d --force-recreate backend frontend`. Проверьте health и пользовательские сценарии. Простое возвращение старого коммита не отменяет миграции: откат БД требует проверенной копии и анализа совместимости.

`sudo docker compose down` останавливает сервисы, сохраняя данные. **Не добавляйте `-v`**: это удалит volumes с БД и сертификатами. Секреты в POSTGRES_PASSWORD не меняют пароль уже инициализированной БД автоматически; смена требует согласованного ALTER ROLE и обновления окружения.

Для защиты сохраните скриншоты сайта по реальному адресу, успешного health, Compose ps, применения миграций, сертификата, UFW, мониторинга и backup/restore. Закройте секреты. Заполните фактические дату, адрес и результаты в ПР7/8/13 только после реального запуска. Сейчас эти действия остаются ручными.
