"""Email helpers using Resend. Async-friendly via asyncio.to_thread."""
import os
import asyncio
import logging
from typing import Optional
import resend

logger = logging.getLogger("red.email")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
SENDER_NAME = os.environ.get("SENDER_NAME", "Red de Amor y Solidaridad")
SITE_URL = os.environ.get("SITE_URL", "")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


async def send_email(to: str, subject: str, html: str) -> Optional[dict]:
    """Send a transactional email via Resend. Fire-and-forget safe (returns None on failure)."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not set; skipping email to %s", to)
        return None
    params = {
        "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Sent email to %s id=%s", to, result.get("id"))
        return result
    except Exception as e:
        logger.error("Resend send failed to %s: %s", to, e)
        return None


def _layout(title: str, body_html: str, cta_label: str = "", cta_url: str = "") -> str:
    cta = ""
    if cta_label and cta_url:
        cta = f"""
        <tr><td style="padding:24px 0 8px 0;">
          <a href="{cta_url}" style="display:inline-block;background:#E97A3A;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;font-size:13px;padding:14px 28px;border-radius:9999px;">{cta_label}</a>
        </td></tr>"""
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title}</title></head>
<body style="margin:0;background:#FBF8F3;font-family:Helvetica,Arial,sans-serif;color:#112A26;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F3;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;">
        <tr><td style="background:#1F4E47;padding:24px 32px;color:#ffffff;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">
          Red de Amor y Solidaridad
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#112A26;font-weight:800;">{title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#4A625F;">{body_html}</div>
          {cta}
        </td></tr>
        <tr><td style="background:#F8FAFA;padding:18px 32px;font-size:12px;color:#7E8E8B;border-top:1px solid #EFF2F1;">
          1104 S Crane Ave, Odessa, TX · +1 (432) 258-4444 · info@lovesolidarity.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


async def send_welcome_entrepreneur(email: str, business_name: str, owner_name: str):
    site = SITE_URL or "#"
    body = f"""
        <p>Hola <strong>{owner_name}</strong>, ¡bienvenido a la RED!</p>
        <p>Tu negocio <strong>{business_name}</strong> ya está publicado en nuestro directorio comunitario. A partir de ahora, clientes locales podrán encontrarte por categoría y ciudad.</p>
        <p>Tres consejos para destacar:</p>
        <ul style="padding-left:18px;margin:0 0 12px;">
          <li>Sube un logo y una foto de portada llamativa.</li>
          <li>Completa tus redes sociales (WhatsApp, Instagram, Facebook).</li>
          <li>Comparte tu perfil con tus clientes para que dejen reseñas.</li>
        </ul>
        <p>Hello <strong>{owner_name}</strong>, welcome to the RED! Your business <strong>{business_name}</strong> is now live in our community directory. Local customers can find you by category and city.</p>
    """
    return await send_email(
        email,
        "¡Bienvenido a la RED! · Welcome to the RED!",
        _layout("¡Bienvenido a la RED!", body, "Ir a mi panel", f"{site}/dashboard"),
    )


async def send_welcome_client(email: str, full_name: str):
    site = SITE_URL or "#"
    body = f"""
        <p>Hola <strong>{full_name}</strong>, ¡bienvenido a la RED!</p>
        <p>Ahora tienes acceso completo al directorio de emprendedores y negocios locales de confianza. Encuentra servicios, contacta a sus dueños y apoya a tu comunidad.</p>
        <p>Hello <strong>{full_name}</strong>, welcome to the RED! You now have full access to our trusted local business directory.</p>
    """
    return await send_email(
        email,
        "¡Bienvenido a la RED! · Welcome to the RED!",
        _layout("¡Bienvenido a la RED!", body, "Explorar el directorio", f"{site}/directory"),
    )


async def send_password_reset(email: str, name: str, reset_url: str):
    body = f"""
        <p>Hola <strong>{name or email}</strong>,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en la Red de Amor y Solidaridad. Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expira en <strong>1 hora</strong>.</p>
        <p>Si no fuiste tú, puedes ignorar este mensaje — tu contraseña actual seguirá funcionando.</p>
        <hr style="border:none;border-top:1px solid #EFF2F1;margin:24px 0;" />
        <p>Hi <strong>{name or email}</strong>, we received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore the email.</p>
    """
    return await send_email(
        email,
        "Restablecer tu contraseña · Reset your password",
        _layout("Restablecer tu contraseña", body, "Crear nueva contraseña", reset_url),
    )

