/**
 * Help System
 * Comprehensive game instructions and help system in Spanish
 * Requirements: 5.4 - Comprehensive game instructions and help system
 */

export class HelpSystem {
    constructor() {
        this.helpContainer = null;
        this.currentSection = 'overview';
        this.isVisible = false;
        this.createHelpContainer();
    }

    /**
     * Create help system container
     */
    createHelpContainer() {
        this.helpContainer = document.createElement('div');
        this.helpContainer.className = 'help-overlay';
        this.helpContainer.style.display = 'none';
        document.body.appendChild(this.helpContainer);
    }

    /**
     * Show help system
     * @param {string} section - Initial section to show
     */
    show(section = 'overview') {
        this.currentSection = section;
        this.isVisible = true;
        this.render();
        this.helpContainer.style.display = 'flex';
    }

    /**
     * Hide help system
     */
    hide() {
        this.isVisible = false;
        this.helpContainer.style.display = 'none';
    }

    /**
     * Toggle help system visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Render help content
     */
    render() {
        const helpContent = this.getHelpContent();
        
        this.helpContainer.innerHTML = `
            <div class="help-content">
                <div class="help-header">
                    <h1>Inferno Pixelado: Guía del Jugador</h1>
                    <button id="helpCloseBtn" class="help-close-btn">&times;</button>
                </div>
                
                <div class="help-body">
                    <nav class="help-navigation">
                        ${this.renderNavigation()}
                    </nav>
                    
                    <main class="help-main">
                        ${helpContent}
                    </main>
                </div>
                
                <div class="help-footer">
                    <button id="helpBackBtn" class="help-button secondary">Volver al Juego</button>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    /**
     * Render navigation menu
     */
    renderNavigation() {
        const sections = [
            { id: 'overview', title: 'Resumen del Juego', icon: '🎮' },
            { id: 'controls', title: 'Controles', icon: '⌨️' },
            { id: 'objectives', title: 'Objetivos', icon: '🎯' },
            { id: 'gameplay', title: 'Jugabilidad', icon: '🕹️' },
            { id: 'levels', title: 'Niveles', icon: '🌋' },
            { id: 'story', title: 'Historia', icon: '📖' },
            { id: 'tips', title: 'Consejos', icon: '💡' },
            { id: 'troubleshooting', title: 'Solución de Problemas', icon: '🔧' }
        ];

        return sections.map(section => `
            <button class="help-nav-item ${section.id === this.currentSection ? 'active' : ''}" 
                    data-section="${section.id}">
                <span class="help-nav-icon">${section.icon}</span>
                <span class="help-nav-title">${section.title}</span>
            </button>
        `).join('');
    }

    /**
     * Get help content for current section
     */
    getHelpContent() {
        const content = {
            overview: this.getOverviewContent(),
            controls: this.getControlsContent(),
            objectives: this.getObjectivesContent(),
            gameplay: this.getGameplayContent(),
            levels: this.getLevelsContent(),
            story: this.getStoryContent(),
            tips: this.getTipsContent(),
            troubleshooting: this.getTroubleshootingContent()
        };

        return content[this.currentSection] || content.overview;
    }

    /**
     * Get overview content
     */
    getOverviewContent() {
        return `
            <div class="help-section">
                <h2>🎮 Bienvenido a Inferno Pixelado</h2>
                <p>Embárcate en el épico viaje de Dante a través de los nueve círculos del Infierno, basado en la obra maestra de Dante Alighieri, "La Divina Comedia".</p>
                
                <h3>¿Qué es este juego?</h3>
                <p>Inferno Pixelado es un juego de laberintos en 2D donde controlas a Dante en su descenso por el Infierno. Cada nivel representa un círculo diferente del Infierno, con sus propios desafíos y narrativa.</p>
                
                <h3>Objetivo Principal</h3>
                <p>Tu misión es guiar a Dante a través de cada círculo del Infierno, completando objetivos específicos en cada nivel para progresar en tu viaje hacia la redención.</p>
                
                <div class="help-highlight">
                    <h4>🌟 Características Principales</h4>
                    <ul>
                        <li>9 niveles únicos basados en los círculos del Infierno</li>
                        <li>Narrativa completa en español</li>
                        <li>Sistema de guardado automático</li>
                        <li>Gráficos pixel art atmosféricos</li>
                        <li>Efectos de iluminación dinámicos</li>
                        <li>Funciona completamente sin conexión</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Get controls content
     */
    getControlsContent() {
        return `
            <div class="help-section">
                <h2>⌨️ Controles del Juego</h2>
                
                <div class="controls-grid">
                    <div class="control-group">
                        <h3>Movimiento</h3>
                        <div class="control-item">
                            <kbd>W</kbd> <kbd>↑</kbd>
                            <span>Mover hacia arriba</span>
                        </div>
                        <div class="control-item">
                            <kbd>S</kbd> <kbd>↓</kbd>
                            <span>Mover hacia abajo</span>
                        </div>
                        <div class="control-item">
                            <kbd>A</kbd> <kbd>←</kbd>
                            <span>Mover hacia la izquierda</span>
                        </div>
                        <div class="control-item">
                            <kbd>D</kbd> <kbd>→</kbd>
                            <span>Mover hacia la derecha</span>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <h3>Interfaz</h3>
                        <div class="control-item">
                            <kbd>ESC</kbd>
                            <span>Abrir/cerrar menú</span>
                        </div>
                        <div class="control-item">
                            <kbd>H</kbd>
                            <span>Mostrar/ocultar ayuda</span>
                        </div>
                        <div class="control-item">
                            <kbd>M</kbd>
                            <span>Silenciar/activar audio</span>
                        </div>
                        <div class="control-item">
                            <kbd>ENTER</kbd>
                            <span>Continuar diálogo</span>
                        </div>
                    </div>
                </div>
                
                <div class="help-tip">
                    <h4>💡 Consejo</h4>
                    <p>Puedes usar tanto las teclas WASD como las flechas del teclado para moverte. Elige la opción que te resulte más cómoda.</p>
                </div>
            </div>
        `;
    }

    /**
     * Get objectives content
     */
    getObjectivesContent() {
        return `
            <div class="help-section">
                <h2>🎯 Objetivos del Juego</h2>
                
                <p>En cada nivel, debes completar tres objetivos principales para poder avanzar al siguiente círculo del Infierno:</p>
                
                <div class="objective-list">
                    <div class="objective-item">
                        <div class="objective-icon">🟪</div>
                        <div class="objective-content">
                            <h3>1. Encontrar a Virgilio</h3>
                            <p>En el primer nivel, debes encontrar a Virgilio, tu guía a través del Infierno. Aparece como un cuadrado púrpura en el laberinto.</p>
                            <p><strong>Estado:</strong> Pendiente → Encontrado</p>
                        </div>
                    </div>
                    
                    <div class="objective-item">
                        <div class="objective-icon">🟦</div>
                        <div class="objective-content">
                            <h3>2. Recolectar Fragmentos</h3>
                            <p>Cada nivel contiene fragmentos (cuadrados azules) que debes recolectar. El número de fragmentos aumenta con cada nivel.</p>
                            <p><strong>Progreso:</strong> X/3 (varía por nivel)</p>
                        </div>
                    </div>
                    
                    <div class="objective-item">
                        <div class="objective-icon">🟧</div>
                        <div class="objective-content">
                            <h3>3. Llegar a la Salida</h3>
                            <p>Una vez completados los objetivos anteriores, la salida (cuadrado naranja) se desbloqueará. Llega hasta ella para completar el nivel.</p>
                            <p><strong>Estado:</strong> Bloqueada → Desbloqueada</p>
                        </div>
                    </div>
                </div>
                
                <div class="help-warning">
                    <h4>⚠️ Importante</h4>
                    <p>No puedes completar un nivel hasta que hayas cumplido TODOS los objetivos. La salida permanecerá bloqueada hasta entonces.</p>
                </div>
            </div>
        `;
    }

    /**
     * Get gameplay content
     */
    getGameplayContent() {
        return `
            <div class="help-section">
                <h2>🕹️ Mecánicas de Juego</h2>
                
                <h3>Navegación por el Laberinto</h3>
                <ul>
                    <li>Muévete por el laberinto usando las teclas de dirección</li>
                    <li>No puedes atravesar paredes (líneas marrones)</li>
                    <li>Los caminos libres aparecen en color beige</li>
                    <li>Tu posición actual se marca con un cuadrado rojo</li>
                </ul>
                
                <h3>Sistema de Iluminación</h3>
                <p>El juego cuenta con iluminación dinámica que sigue a Dante, creando una atmósfera inmersiva. La luz cambia según el círculo del Infierno en el que te encuentres.</p>
                
                <h3>Guardado Automático</h3>
                <p>Tu progreso se guarda automáticamente cuando:</p>
                <ul>
                    <li>Completas un objetivo</li>
                    <li>Recolectas un fragmento</li>
                    <li>Cambias de nivel</li>
                    <li>Modificas la configuración</li>
                </ul>
                
                <h3>Panel de Progreso</h3>
                <p>El panel lateral muestra tu progreso actual:</p>
                <ul>
                    <li><strong>Nivel:</strong> Círculo actual del Infierno</li>
                    <li><strong>Virgilio:</strong> Estado de encuentro con tu guía</li>
                    <li><strong>Fragmentos:</strong> Cantidad recolectada vs. total</li>
                    <li><strong>Salida:</strong> Estado de acceso al siguiente nivel</li>
                </ul>
                
                <div class="help-tip">
                    <h4>💡 Estrategia</h4>
                    <p>Explora sistemáticamente el laberinto. Los fragmentos y Virgilio pueden estar en cualquier parte, así que no te apresures.</p>
                </div>
            </div>
        `;
    }

    /**
     * Get levels content
     */
    getLevelsContent() {
        return `
            <div class="help-section">
                <h2>🌋 Los Círculos del Infierno</h2>
                
                <p>El juego presenta 9 niveles únicos, cada uno basado en un círculo del Infierno de Dante:</p>
                
                <div class="levels-list">
                    <div class="level-item">
                        <h3>Nivel 1: Bosque Oscuro</h3>
                        <p>El comienzo del viaje. Aquí encuentras a Virgilio, tu guía.</p>
                        <p><strong>Tamaño:</strong> 15x15 | <strong>Fragmentos:</strong> 3</p>
                    </div>
                    
                    <div class="level-item">
                        <h3>Nivel 2: Limbo</h3>
                        <p>Primer círculo del Infierno, hogar de las almas virtuosas no bautizadas.</p>
                        <p><strong>Tamaño:</strong> 18x18 | <strong>Fragmentos:</strong> 4</p>
                    </div>
                    
                    <div class="level-item">
                        <h3>Nivel 3: Lujuria</h3>
                        <p>Segundo círculo, donde los vientos eternos castigan a los lujuriosos.</p>
                        <p><strong>Tamaño:</strong> 21x21 | <strong>Fragmentos:</strong> 5</p>
                    </div>
                    
                    <div class="level-item">
                        <h3>Niveles 4-9</h3>
                        <p>Los círculos restantes: Gula, Avaricia e Ira, Ciudad de Dite, Violencia, Fraude, y Traición.</p>
                        <p><strong>Dificultad:</strong> Progresivamente más desafiantes</p>
                    </div>
                </div>
                
                <h3>Progresión de Dificultad</h3>
                <ul>
                    <li><strong>Tamaño del laberinto:</strong> Aumenta con cada nivel</li>
                    <li><strong>Número de fragmentos:</strong> Se incrementa progresivamente</li>
                    <li><strong>Complejidad:</strong> Laberintos más intrincados</li>
                    <li><strong>Temática visual:</strong> Cada círculo tiene su propia paleta de colores</li>
                </ul>
                
                <div class="help-highlight">
                    <h4>🎨 Temas Visuales</h4>
                    <p>Cada círculo del Infierno tiene su propia identidad visual única, con colores y atmósfera que reflejan la naturaleza de los pecados castigados en ese nivel.</p>
                </div>
            </div>
        `;
    }

    /**
     * Get story content
     */
    getStoryContent() {
        return `
            <div class="help-section">
                <h2>📖 La Historia</h2>
                
                <h3>Basado en La Divina Comedia</h3>
                <p>Este juego está inspirado en la primera parte de la obra maestra de Dante Alighieri, "La Divina Comedia", específicamente en el "Infierno".</p>
                
                <h3>El Viaje de Dante</h3>
                <p>Te encuentras perdido en un bosque oscuro, donde "la recta vía era perdida". Virgilio, el poeta romano, aparece para guiarte a través del Infierno hacia la redención.</p>
                
                <h3>Los Personajes</h3>
                <div class="character-list">
                    <div class="character-item">
                        <h4>🔴 Dante (Tú)</h4>
                        <p>El protagonista perdido que debe atravesar el Infierno para encontrar la salvación. Representado por el cuadrado rojo que controlas.</p>
                    </div>
                    
                    <div class="character-item">
                        <h4>🟪 Virgilio</h4>
                        <p>El poeta romano que sirve como guía de Dante. Solo aparece en el primer nivel, pero su sabiduría te acompaña durante todo el viaje.</p>
                    </div>
                </div>
                
                <h3>Los Círculos del Infierno</h3>
                <p>Cada nivel representa un círculo diferente del Infierno, donde se castigan diferentes tipos de pecados:</p>
                <ul>
                    <li><strong>Limbo:</strong> Almas virtuosas no bautizadas</li>
                    <li><strong>Lujuria:</strong> Los que pecaron por amor carnal</li>
                    <li><strong>Gula:</strong> Los glotones y golosos</li>
                    <li><strong>Avaricia e Ira:</strong> Los avaros, pródigos e iracundos</li>
                    <li><strong>Ciudad de Dite:</strong> Los herejes</li>
                    <li><strong>Violencia:</strong> Los violentos contra el prójimo, sí mismos y Dios</li>
                    <li><strong>Fraude:</strong> Los fraudulentos en Malebolge</li>
                    <li><strong>Traición:</strong> Los traidores en el lago helado Cocito</li>
                </ul>
                
                <div class="help-quote">
                    <blockquote>
                        "En el medio del camino de nuestra vida, me encontré en una selva oscura, donde la recta vía era perdida."
                    </blockquote>
                    <cite>— Dante Alighieri, Infierno, Canto I</cite>
                </div>
            </div>
        `;
    }

    /**
     * Get tips content
     */
    getTipsContent() {
        return `
            <div class="help-section">
                <h2>💡 Consejos y Estrategias</h2>
                
                <h3>Estrategias de Exploración</h3>
                <div class="tip-list">
                    <div class="tip-item">
                        <h4>🗺️ Mapea Mentalmente</h4>
                        <p>Trata de recordar las áreas que ya has explorado para evitar perderte en laberintos más grandes.</p>
                    </div>
                    
                    <div class="tip-item">
                        <h4>🔍 Exploración Sistemática</h4>
                        <p>Explora siguiendo las paredes o usando un patrón consistente para asegurarte de no perderte ningún área.</p>
                    </div>
                    
                    <div class="tip-item">
                        <h4>🎯 Prioriza Objetivos</h4>
                        <p>No hay un orden específico para completar los objetivos. Recolecta lo que encuentres primero.</p>
                    </div>
                </div>
                
                <h3>Optimización del Rendimiento</h3>
                <ul>
                    <li>Cierra otras pestañas del navegador para mejorar el rendimiento</li>
                    <li>Usa el modo de pantalla completa para una mejor experiencia</li>
                    <li>Si experimentas lag, reduce el volumen o desactiva el audio temporalmente</li>
                </ul>
                
                <h3>Gestión del Progreso</h3>
                <ul>
                    <li>El juego se guarda automáticamente, no necesitas hacer nada especial</li>
                    <li>Puedes cerrar el navegador y continuar donde lo dejaste</li>
                    <li>Si quieres empezar de nuevo, usa "Reiniciar desde cero" en el menú</li>
                </ul>
                
                <h3>Solución de Problemas Comunes</h3>
                <div class="problem-solution">
                    <h4>❓ "No puedo encontrar el último fragmento"</h4>
                    <p><strong>Solución:</strong> Los fragmentos pueden estar en callejones sin salida o áreas menos obvias. Explora sistemáticamente cada rincón del laberinto.</p>
                </div>
                
                <div class="problem-solution">
                    <h4>❓ "El juego va muy lento"</h4>
                    <p><strong>Solución:</strong> Cierra otras aplicaciones, actualiza tu navegador, o intenta jugar en una ventana más pequeña.</p>
                </div>
                
                <div class="problem-solution">
                    <h4>❓ "Se perdió mi progreso"</h4>
                    <p><strong>Solución:</strong> Verifica que no hayas limpiado la caché del navegador. El progreso se guarda localmente en tu dispositivo.</p>
                </div>
                
                <div class="help-highlight">
                    <h4>🏆 Consejo de Maestro</h4>
                    <p>Disfruta la narrativa y la atmósfera. Este no es solo un juego de laberintos, sino una experiencia literaria interactiva.</p>
                </div>
            </div>
        `;
    }

    /**
     * Get troubleshooting content
     */
    getTroubleshootingContent() {
        return `
            <div class="help-section">
                <h2>🔧 Solución de Problemas</h2>
                
                <h3>Problemas Técnicos Comunes</h3>
                
                <div class="troubleshoot-item">
                    <h4>🚫 El juego no carga</h4>
                    <div class="solution-steps">
                        <p><strong>Posibles causas y soluciones:</strong></p>
                        <ol>
                            <li>Actualiza tu navegador a la versión más reciente</li>
                            <li>Habilita JavaScript en tu navegador</li>
                            <li>Limpia la caché y recarga la página</li>
                            <li>Verifica que tu navegador soporte HTML5 Canvas</li>
                        </ol>
                    </div>
                </div>
                
                <div class="troubleshoot-item">
                    <h4>🔇 No hay sonido</h4>
                    <div class="solution-steps">
                        <p><strong>Verifica lo siguiente:</strong></p>
                        <ol>
                            <li>El volumen del sistema no esté silenciado</li>
                            <li>El volumen del juego esté activado (tecla M)</li>
                            <li>Tu navegador permita la reproducción de audio</li>
                            <li>No tengas otras aplicaciones usando el audio</li>
                        </ol>
                    </div>
                </div>
                
                <div class="troubleshoot-item">
                    <h4>🐌 Rendimiento lento</h4>
                    <div class="solution-steps">
                        <p><strong>Para mejorar el rendimiento:</strong></p>
                        <ol>
                            <li>Cierra otras pestañas y aplicaciones</li>
                            <li>Usa un navegador actualizado</li>
                            <li>Reduce el tamaño de la ventana del navegador</li>
                            <li>Desactiva extensiones innecesarias</li>
                            <li>Reinicia tu navegador</li>
                        </ol>
                    </div>
                </div>
                
                <div class="troubleshoot-item">
                    <h4>💾 Problemas de guardado</h4>
                    <div class="solution-steps">
                        <p><strong>Si el progreso no se guarda:</strong></p>
                        <ol>
                            <li>Verifica que el almacenamiento local esté habilitado</li>
                            <li>No uses modo incógnito/privado</li>
                            <li>Libera espacio en tu dispositivo</li>
                            <li>No limpies la caché del navegador</li>
                        </ol>
                    </div>
                </div>
                
                <h3>Requisitos del Sistema</h3>
                <div class="system-requirements">
                    <h4>Navegadores Compatibles</h4>
                    <ul>
                        <li>Chrome 60+ (recomendado)</li>
                        <li>Firefox 55+</li>
                        <li>Safari 11+</li>
                        <li>Edge 79+</li>
                    </ul>
                    
                    <h4>Características Requeridas</h4>
                    <ul>
                        <li>HTML5 Canvas</li>
                        <li>JavaScript ES6+</li>
                        <li>localStorage</li>
                        <li>Web Audio API (opcional)</li>
                    </ul>
                </div>
                
                <h3>Contacto y Soporte</h3>
                <div class="support-info">
                    <p>Si continúas experimentando problemas:</p>
                    <ol>
                        <li>Anota el mensaje de error exacto (si aparece alguno)</li>
                        <li>Indica tu navegador y versión</li>
                        <li>Describe los pasos que llevaron al problema</li>
                        <li>Intenta reproducir el problema en modo incógnito</li>
                    </ol>
                </div>
                
                <div class="help-warning">
                    <h4>⚠️ Nota Importante</h4>
                    <p>Este juego funciona completamente en tu navegador y no requiere conexión a internet después de la carga inicial. Todos los datos se almacenan localmente en tu dispositivo.</p>
                </div>
            </div>
        `;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('helpCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Back button
        const backBtn = document.getElementById('helpBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.hide());
        }

        // Navigation items
        const navItems = document.querySelectorAll('.help-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Close on overlay click
        this.helpContainer.addEventListener('click', (e) => {
            if (e.target === this.helpContainer) {
                this.hide();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isVisible) {
                if (e.key === 'Escape') {
                    this.hide();
                }
            }
        });
    }

    /**
     * Show specific help section
     * @param {string} section - Section to show
     */
    showSection(section) {
        this.currentSection = section;
        this.render();
    }

    /**
     * Get current section
     * @returns {string} - Current section
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Check if help is visible
     * @returns {boolean} - True if visible
     */
    isHelpVisible() {
        return this.isVisible;
    }
}

// Add CSS styles for help system
const helpStyles = `
.help-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 4000;
    animation: helpFadeIn 0.3s ease-out;
}

.help-content {
    background-color: #2d1810;
    border: 3px solid #8B4513;
    border-radius: 12px;
    width: 90%;
    max-width: 1200px;
    height: 90%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    animation: helpSlideIn 0.3s ease-out;
}

.help-header {
    background-color: rgba(139, 69, 19, 0.3);
    padding: 20px;
    border-bottom: 2px solid #8B4513;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.help-header h1 {
    color: #FFD700;
    font-size: 1.5rem;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.help-close-btn {
    background: none;
    border: 2px solid #DEB887;
    color: #DEB887;
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
}

.help-close-btn:hover {
    background-color: #DEB887;
    color: #2d1810;
}

.help-body {
    flex: 1;
    display: flex;
    min-height: 0;
}

.help-navigation {
    width: 250px;
    background-color: rgba(0, 0, 0, 0.3);
    border-right: 2px solid #8B4513;
    padding: 20px 0;
    overflow-y: auto;
}

.help-nav-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 20px;
    background: none;
    border: none;
    color: #DEB887;
    text-align: left;
    cursor: pointer;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
}

.help-nav-item:hover {
    background-color: rgba(139, 69, 19, 0.2);
    color: #FFD700;
}

.help-nav-item.active {
    background-color: rgba(139, 69, 19, 0.4);
    color: #FFD700;
    border-left-color: #FFD700;
}

.help-nav-icon {
    font-size: 1.2rem;
    margin-right: 12px;
    width: 24px;
    text-align: center;
}

.help-nav-title {
    font-weight: bold;
}

.help-main {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    color: #DEB887;
    line-height: 1.6;
}

.help-section h2 {
    color: #FFD700;
    margin-bottom: 20px;
    font-size: 1.8rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.help-section h3 {
    color: #DEB887;
    margin: 25px 0 15px 0;
    font-size: 1.3rem;
}

.help-section h4 {
    color: #FFD700;
    margin: 20px 0 10px 0;
    font-size: 1.1rem;
}

.help-section p {
    margin-bottom: 15px;
}

.help-section ul, .help-section ol {
    margin: 15px 0;
    padding-left: 25px;
}

.help-section li {
    margin-bottom: 8px;
}

.help-highlight {
    background-color: rgba(139, 69, 19, 0.2);
    border-left: 4px solid #FFD700;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
}

.help-tip {
    background-color: rgba(65, 105, 225, 0.2);
    border-left: 4px solid #4169E1;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
}

.help-warning {
    background-color: rgba(255, 107, 107, 0.2);
    border-left: 4px solid #ff6b6b;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
}

.help-quote {
    background-color: rgba(0, 0, 0, 0.3);
    border-left: 4px solid #8B4513;
    padding: 20px;
    margin: 20px 0;
    border-radius: 4px;
    font-style: italic;
}

.help-quote blockquote {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    color: #FFD700;
}

.help-quote cite {
    color: #DEB887;
    font-size: 0.9rem;
}

.controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin: 20px 0;
}

.control-group h3 {
    color: #FFD700;
    margin-bottom: 15px;
    border-bottom: 1px solid #8B4513;
    padding-bottom: 5px;
}

.control-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.control-item kbd {
    background-color: #8B4513;
    color: #ffffff;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    margin-right: 10px;
    min-width: 30px;
    text-align: center;
}

.objective-list, .levels-list, .character-list {
    margin: 20px 0;
}

.objective-item, .level-item, .character-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
    padding: 15px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
}

.objective-icon {
    font-size: 2rem;
    margin-right: 15px;
    flex-shrink: 0;
}

.objective-content, .level-content, .character-content {
    flex: 1;
}

.tip-list {
    margin: 20px 0;
}

.tip-item {
    margin-bottom: 20px;
    padding: 15px;
    background-color: rgba(65, 105, 225, 0.1);
    border-radius: 8px;
    border-left: 4px solid #4169E1;
}

.troubleshoot-item {
    margin-bottom: 25px;
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
}

.troubleshoot-item h4 {
    color: #ff6b6b;
    margin-bottom: 10px;
}

.solution-steps {
    margin-top: 10px;
}

.system-requirements {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
}

.support-info {
    background-color: rgba(139, 69, 19, 0.2);
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
}

.problem-solution {
    margin-bottom: 20px;
    padding: 15px;
    background-color: rgba(255, 165, 0, 0.1);
    border-left: 4px solid #FFA500;
    border-radius: 4px;
}

.help-footer {
    background-color: rgba(139, 69, 19, 0.3);
    padding: 20px;
    border-top: 2px solid #8B4513;
    text-align: center;
}

.help-button {
    padding: 12px 24px;
    border: 2px solid #8B4513;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
}

.help-button.secondary {
    background-color: #8B4513;
    color: #ffffff;
}

.help-button.secondary:hover {
    background-color: #A0522D;
    transform: translateY(-2px);
}

@keyframes helpFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes helpSlideIn {
    from {
        transform: translateY(-50px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* Responsive design */
@media (max-width: 1024px) {
    .help-content {
        width: 95%;
        height: 95%;
    }
    
    .help-navigation {
        width: 200px;
    }
    
    .controls-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .help-body {
        flex-direction: column;
    }
    
    .help-navigation {
        width: 100%;
        max-height: 150px;
        border-right: none;
        border-bottom: 2px solid #8B4513;
        display: flex;
        overflow-x: auto;
        padding: 10px;
    }
    
    .help-nav-item {
        flex-shrink: 0;
        min-width: 120px;
        padding: 8px 12px;
        border-left: none;
        border-bottom: 3px solid transparent;
    }
    
    .help-nav-item.active {
        border-left: none;
        border-bottom-color: #FFD700;
    }
    
    .help-main {
        padding: 20px;
    }
    
    .help-header h1 {
        font-size: 1.2rem;
    }
    
    .objective-item, .level-item, .character-item {
        flex-direction: column;
        text-align: center;
    }
    
    .objective-icon {
        margin-right: 0;
        margin-bottom: 10px;
    }
}

@media (max-width: 480px) {
    .help-content {
        width: 98%;
        height: 98%;
    }
    
    .help-header {
        padding: 15px;
    }
    
    .help-main {
        padding: 15px;
    }
    
    .help-section h2 {
        font-size: 1.5rem;
    }
    
    .help-section h3 {
        font-size: 1.2rem;
    }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
    .help-overlay {
        animation: none;
    }
    
    .help-content {
        animation: none;
    }
    
    .help-button:hover {
        transform: none;
    }
}

/* High contrast mode */
@media (prefers-contrast: high) {
    .help-content {
        background-color: #000000;
        border-color: #ffffff;
    }
    
    .help-header {
        background-color: #000000;
        border-color: #ffffff;
    }
    
    .help-navigation {
        background-color: #000000;
        border-color: #ffffff;
    }
    
    .help-nav-item {
        color: #ffffff;
    }
    
    .help-nav-item.active {
        background-color: #ffffff;
        color: #000000;
    }
    
    .help-section h2,
    .help-section h3,
    .help-section h4 {
        color: #ffffff;
    }
    
    .help-main {
        color: #ffffff;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = helpStyles;
document.head.appendChild(styleSheet);