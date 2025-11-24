# 📧 Configuración de Envío de Correos - SIGEU

## 🔒 Validación de Correos

Solo se aceptan correos institucionales: **@uao.edu.co**

## ¿Qué necesitas configurar?

Para que funcione el envío de correos de recuperación de contraseña, debes configurar un servidor SMTP en el archivo `.env` del backend.

## Opción 1: Gmail (Recomendado para producción)

### Pasos:

1. **Habilitar verificación en 2 pasos en tu cuenta de Gmail:**
   - Ve a https://myaccount.google.com/security
   - Activa "Verificación en dos pasos"

2. **Crear una contraseña de aplicación:**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y el dispositivo que usas
   - Gmail te dará una contraseña de 16 caracteres

3. **Configurar el archivo `.env` en el backend:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu_correo@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # La contraseña de 16 caracteres (sin espacios)
   SMTP_FROM=tu_correo@gmail.com
   ```

4. **Reiniciar el servidor backend**

### Ventajas:
- ✅ Correos llegan a la bandeja de entrada
- ✅ Servicio gratuito y confiable
- ✅ Funciona en producción

## Opción 2: Mailtrap (Solo para desarrollo/pruebas)

Si solo quieres probar sin enviar correos reales:

1. Crear cuenta en https://mailtrap.io (gratis)
2. Obtener credenciales SMTP de tu inbox
3. Configurar en `.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=tu_usuario_mailtrap
   SMTP_PASS=tu_contraseña_mailtrap
   SMTP_FROM=noreply@sigeu.com
   ```

### Ventajas:
- ✅ Perfecto para desarrollo
- ✅ No necesita configuración compleja
- ⚠️ Los correos NO se envían realmente (solo se capturan en Mailtrap)

## Opción 3: Otros servicios SMTP

Puedes usar otros servicios como:
- **SendGrid**: Hasta 100 correos/día gratis
- **Mailgun**: 5,000 correos/mes gratis
- **Amazon SES**: Económico para producción

## ¿Cómo funciona el flujo de recuperación?

1. Usuario hace clic en "¿Olvidó su contraseña?" en el login
2. Ingresa su correo electrónico
3. El backend genera un token JWT válido por 30 minutos
4. Se envía un correo con un link: `http://localhost:5173/reset-password?token=xxxxx`
5. Usuario hace clic en el link
6. Ingresa su nueva contraseña
7. El token se valida y se actualiza la contraseña

## ⚠️ Importante

- El token de recuperación expira en **30 minutos**
- Solo se puede usar **una vez**
- El correo debe estar registrado en la base de datos
- Si el SMTP no está configurado, el backend devolverá el token en la respuesta (útil para pruebas)

## 🔧 Solución de problemas

### "No llegan los correos"
1. Verifica que las credenciales SMTP sean correctas
2. Revisa la carpeta de SPAM
3. Si usas Gmail, asegúrate de tener la contraseña de aplicación correcta
4. Revisa los logs del servidor backend para ver errores

### "Error de autenticación SMTP"
- Verifica que SMTP_USER y SMTP_PASS sean correctos
- Si usas Gmail, usa la contraseña de aplicación, NO tu contraseña normal

### "Token inválido o expirado"
- El token solo dura 30 minutos
- Solicita uno nuevo desde "Olvidar contraseña"
