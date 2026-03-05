variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "zone_id" {
  type        = string
  description = "spike.land zone ID"
}

variable "account_id" {
  type        = string
  description = "Cloudflare account ID"
}
