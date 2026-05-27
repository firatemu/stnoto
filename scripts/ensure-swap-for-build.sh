#!/usr/bin/env bash
# Idempotent: adds ~4G swap so `next build` in Docker does not hit OOM on 8GB hosts.
# Run once on the server: sudo ./scripts/ensure-swap-for-build.sh
set -euo pipefail

SWAPFILE="${SWAPFILE:-/swapfile-stnoto-build}"
SIZE_GB="${SWAP_SIZE_GB:-4}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Root gerekli: sudo $0" >&2
  exit 1
fi

if swapon --show 2>/dev/null | grep -qF "$SWAPFILE"; then
  echo "Swap zaten aktif: $SWAPFILE"
  swapon --show
  exit 0
fi

if [[ ! -f "$SWAPFILE" ]]; then
  echo "Oluşturuluyor: ${SIZE_GB}G -> $SWAPFILE"
  if fallocate -l "${SIZE_GB}G" "$SWAPFILE" 2>/dev/null; then
    :
  else
    dd if=/dev/zero of="$SWAPFILE" bs=1M count=$((SIZE_GB * 1024)) status=progress
  fi
  chmod 600 "$SWAPFILE"
  mkswap "$SWAPFILE"
fi

swapon "$SWAPFILE"
echo "Aktif swap:"
swapon --show
free -h
echo
echo "Kalıcı yapmak için /etc/fstab içine (tek satır, yedek alın):"
echo "  $SWAPFILE none swap sw 0 0"
