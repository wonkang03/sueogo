@echo off
set "LOG_FILE=logs\dev_%%DATE%%_%%TIME:~0,2%%-%%TIME:~3,2%%-%%TIME:~6,2%%.log"
set "LOG_FILE=%LOG_FILE: =%"
npm run dev > %LOG_FILE% 2>&1