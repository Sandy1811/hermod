#!/bin/bash
pm2 flush
pm2 start
pm2 logs --lines 200 -f
