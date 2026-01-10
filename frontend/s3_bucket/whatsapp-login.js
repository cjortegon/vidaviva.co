/**
 * WhatsApp Login Manager
 * Centraliza la lógica de autenticación por WhatsApp con OTP
 */

class WhatsAppLogin {
    constructor() {
        this.LOGIN_URL = '';
        this.COUNTRY_CODE = '+57'; // Colombia

        // Keys para localStorage
        this.STORAGE_KEYS = {
            TOKEN: 'millavero_whatsapp_token',
            PHONE: 'millavero_whatsapp_phone',
        };

        // Estado del modal
        this.currentStep = 'phone'; // 'phone' or 'otp'
        this.phoneNumber = '';
        this.onLoginSuccess = null;
    }

    setLoginRequired = (method) => {
        this.LOGIN_URL = method.path;
    }

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        const token = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
        const phone = localStorage.getItem(this.STORAGE_KEYS.PHONE);
        return !!(token && phone);
    }

    /**
     * Obtiene el token almacenado
     */
    getToken() {
        return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    }

    /**
     * Obtiene el teléfono almacenado
     */
    getPhone() {
        return localStorage.getItem(this.STORAGE_KEYS.PHONE);
    }

    /**
     * Muestra el modal de login
     * @param {Function} onSuccess - Callback ejecutado al login exitoso
     */
    showLoginModal(onSuccess) {
        this.onLoginSuccess = onSuccess;
        this.currentStep = 'phone';
        this.phoneNumber = '';

        const modal = document.getElementById('whatsappLoginModal');
        if (modal) {
            modal.classList.add('show');
            this.renderPhoneStep();
        }
    }

    /**
     * Cierra el modal de login
     */
    closeLoginModal() {
        const modal = document.getElementById('whatsappLoginModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentStep = 'phone';
        this.phoneNumber = '';
    }

    /**
     * Renderiza el paso de ingreso de teléfono
     */
    renderPhoneStep() {
        const content = document.getElementById('loginModalBody');
        if (!content) return;

        content.innerHTML = `
            <div class="login-step">
                <p class="login-description">Ingresa tu número de WhatsApp para continuar</p>
                <div class="phone-input-container">
                    <span class="country-code">${this.COUNTRY_CODE}</span>
                    <input
                        type="tel"
                        id="phoneInput"
                        class="phone-input"
                        placeholder="3001234567"
                        maxlength="10"
                        autocomplete="tel"
                    />
                </div>
                <button class="login-action-btn" onclick="whatsappLogin.requestOTP()">
                    Continuar
                </button>
            </div>
        `;

        // Focus en el input
        setTimeout(() => {
            const input = document.getElementById('phoneInput');
            if (input) {
                input.focus();
                // Solo permitir números
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                });
                // Enter para continuar
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.value.length === 10) {
                        this.requestOTP();
                    }
                });
            }
        }, 100);
    }

    /**
     * Renderiza el paso de ingreso de OTP
     */
    renderOTPStep() {
        const content = document.getElementById('loginModalBody');
        if (!content) return;

        content.innerHTML = `
            <div class="login-step">
                <p class="login-description">
                    Ingresa el código de 4 dígitos enviado a<br>
                    <strong>${this.COUNTRY_CODE} ${this.phoneNumber}</strong>
                </p>
                <div class="otp-input-container">
                    <input
                        type="text"
                        id="otpInput"
                        class="otp-input"
                        placeholder="0000"
                        maxlength="4"
                        autocomplete="one-time-code"
                    />
                </div>
                <button class="login-action-btn" onclick="whatsappLogin.verifyOTP()">
                    Iniciar sesión
                </button>
                <button class="login-back-btn" onclick="whatsappLogin.renderPhoneStep()">
                    ← Cambiar número
                </button>
            </div>
        `;

        // Focus en el input
        setTimeout(() => {
            const input = document.getElementById('otpInput');
            if (input) {
                input.focus();
                // Solo permitir números
                input.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                });
                // Enter para login
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.value.length === 4) {
                        this.verifyOTP();
                    }
                });
            }
        }, 100);
    }

    /**
     * Solicita el OTP al servidor
     */
    async requestOTP() {
        const phoneInput = document.getElementById('phoneInput');
        if (!phoneInput) return;

        const phone = phoneInput.value.trim();

        // Validar que sean 10 dígitos
        if (phone.length !== 10) {
            this.showError('El número debe tener 10 dígitos');
            return;
        }

        // Validar que empiece con 3 (celulares en Colombia)
        if (!phone.startsWith('3')) {
            this.showError('Número inválido. Debe ser un celular');
            return;
        }

        this.phoneNumber = phone;

        // Mostrar loading
        this.showLoading('Enviando código...');

        try {

            const response = await fetch(this.LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'millavero.com:abc123',
                },
                body: JSON.stringify({
                    phone: `${this.COUNTRY_CODE}${phone}`
                })
            });

            const result = await response.json();

            if (response.ok && result.status === 1) {
                this.currentStep = 'otp';
                this.renderOTPStep();
            } else {
                throw new Error(result.message || 'Error al enviar código');
            }

        } catch (error) {
            console.error('Error requesting OTP:', error);
            this.showError('Error al enviar código. Intenta nuevamente.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Verifica el OTP ingresado
     */
    async verifyOTP() {
        const otpInput = document.getElementById('otpInput');
        if (!otpInput) return;

        const otp = otpInput.value.trim();

        // Validar que sean 4 dígitos
        if (otp.length !== 4) {
            this.showError('El código debe tener 4 dígitos');
            return;
        }

        // Mostrar loading
        this.showLoading('Verificando...');

        try {
            const response = await fetch(this.LOGIN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'millavero.com:abc123',
                },
                body: JSON.stringify({
                    phone: `${this.COUNTRY_CODE}${this.phoneNumber}`,
                    otp,
                })
            });
            const result = await response.json();

            if (result.status === 1 && result.data && result.data.token) {
                // Guardar token y teléfono
                this.saveAuthData(result.data.token, this.phoneNumber);

                // Cerrar modal
                this.closeLoginModal();

                // Mostrar mensaje de éxito
                this.showSuccess('Sesión iniciada correctamente');

                // Ejecutar callback de éxito
                if (this.onLoginSuccess) {
                    this.onLoginSuccess();
                }
            } else {
                throw new Error(result.message || 'Código incorrecto');
            }

        } catch (error) {
            console.error('Error verifying OTP:', error);
            this.showError('Código incorrecto. Intenta nuevamente.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Guarda los datos de autenticación
     */
    saveAuthData(token, phone) {
        localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(this.STORAGE_KEYS.PHONE, phone);
        console.log('Auth data saved:', { phone: `+57${phone}`, tokenLength: token.length });
    }

    /**
     * Elimina los datos de autenticación (logout)
     */
    logout() {
        localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(this.STORAGE_KEYS.PHONE);
        console.log('Sesión cerrada');

        // Actualizar UI si existe el botón de logout
        this.updateLogoutButton();
    }

    /**
     * Actualiza el botón de logout en la UI
     */
    updateLogoutButton() {
        const logoutContainer = document.getElementById('logoutContainer');
        if (!logoutContainer) return;

        if (this.isAuthenticated()) {
            const phone = this.getPhone();
            logoutContainer.style.display = 'block';
            logoutContainer.innerHTML = `
                <span class="logout-phone">+57 ${phone}</span>
                <button class="logout-btn" onclick="whatsappLogin.confirmLogout()">Cerrar sesión</button>
            `;
        } else {
            logoutContainer.style.display = 'none';
        }
    }

    /**
     * Confirma el logout
     */
    confirmLogout() {
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
            this.logout();
        }
    }

    /**
     * Muestra mensaje de loading en el modal
     */
    showLoading(message) {
        const content = document.getElementById('loginModalBody');
        if (!content) return;

        const overlay = document.createElement('div');
        overlay.id = 'loginLoadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        content.appendChild(overlay);
    }

    /**
     * Oculta el loading
     */
    hideLoading() {
        const overlay = document.getElementById('loginLoadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Muestra mensaje de error
     */
    showError(message) {
        // Crear elemento de error temporal
        const errorEl = document.createElement('div');
        errorEl.className = 'login-error-message';
        errorEl.textContent = message;

        const content = document.getElementById('loginModalBody');
        if (content) {
            // Remover error anterior si existe
            const oldError = content.querySelector('.login-error-message');
            if (oldError) oldError.remove();

            content.insertBefore(errorEl, content.firstChild);

            // Remover después de 3 segundos
            setTimeout(() => errorEl.remove(), 3000);
        }
    }

    /**
     * Muestra mensaje de éxito
     */
    showSuccess(message) {
        // Implementar notificación de éxito
        console.log('Success:', message);
    }

    /**
     * Valida si se requiere login antes de una acción
     * @param {Function} action - Acción a ejecutar si está autenticado
     */
    requireAuth(action) {
        if (!this.LOGIN_URL || this.isAuthenticated()) {
            action();
        } else {
            this.showLoginModal(action);
        }
    }
}

// Instancia global
const whatsappLogin = new WhatsAppLogin();

// Actualizar botón de logout al cargar
document.addEventListener('DOMContentLoaded', () => {
    whatsappLogin.updateLogoutButton();
});
