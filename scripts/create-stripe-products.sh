#!/usr/bin/env bash
#
# Create all Stripe products and prices for spike.land (live mode).
# Requires: stripe CLI logged in to live mode (`stripe login`).
#
# Usage: bash scripts/create-stripe-products.sh
#
set -euo pipefail

# Helper: create product, extract ID, create price
create_product_and_price() {
  local name="$1"
  local amount="$2"
  local currency="${3:-usd}"
  local lookup_key="$4"
  local recurring_interval="${5:-}"  # empty for one-time
  local metadata="${6:-}"

  echo "── Creating product: $name"

  local create_args=(--name="$name" --live)
  if [[ -n "$metadata" ]]; then
    create_args+=(-d "metadata[tier]=$metadata")
  fi

  local prod_id
  prod_id=$(stripe products create "${create_args[@]}" --format json | jq -r '.id')

  if [[ -z "$prod_id" || "$prod_id" == "null" ]]; then
    echo "ERROR: Failed to create product '$name'" >&2
    return 1
  fi
  echo "   Product: $prod_id"

  local price_args=(
    --product="$prod_id"
    --unit-amount="$amount"
    --currency="$currency"
    --lookup-key="$lookup_key"
    --live
  )
  if [[ -n "$recurring_interval" ]]; then
    price_args+=(-d "recurring[interval]=$recurring_interval")
  fi

  local price_id
  price_id=$(stripe prices create "${price_args[@]}" --format json | jq -r '.id')
  echo "   Price:   $price_id ($lookup_key)"
  echo ""
}

echo "=== Stripe Product & Price Setup for spike.land ==="
echo ""

# ── Subscriptions ──────────────────────────────────────────────────────────

echo "▶ Subscriptions"
echo ""

create_product_and_price "Pro Monthly"      2900  usd pro_monthly      month pro
create_product_and_price "Pro Annual"       29000 usd pro_annual       year  pro
create_product_and_price "Business Monthly"  9900  usd business_monthly month business
create_product_and_price "Business Annual"  99000 usd business_annual  year  business

# ── Credit Packs (one-time) ───────────────────────────────────────────────

echo "▶ Credit Packs"
echo ""

create_product_and_price "500 Credits"   500  usd credits_500
create_product_and_price "2500 Credits"  2000 usd credits_2500
create_product_and_price "7500 Credits"  5000 usd credits_7500

# ── Services (one-time) ──────────────────────────────────────────────────

echo "▶ Services"
echo ""

create_product_and_price "App Builder"     1997 usd app_builder_1997
create_product_and_price "Workshop Seat"    497 usd workshop_seat_497
create_product_and_price "Workshop Team"   1997 usd workshop_team_1997

echo "=== Done! All 10 products created. ==="
echo ""
echo "Next steps:"
echo "  1. Rotate your secret key: Dashboard → Developers → API keys → Roll key"
echo "  2. Create webhook endpoint: Dashboard → Developers → Webhooks → Add endpoint"
echo "     URL: https://spike.land/stripe/webhook"
echo "     Events: checkout.session.completed, customer.subscription.updated,"
echo "             customer.subscription.deleted, invoice.paid, invoice.payment_failed"
echo "  3. Set Workers secrets:"
echo "     cd packages/spike-edge"
echo "     wrangler secret put STRIPE_SECRET_KEY"
echo "     wrangler secret put STRIPE_WEBHOOK_SECRET"
echo "  4. Deploy: cd packages/spike-edge && npm run deploy"
