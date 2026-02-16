import ButtonSettings from "../../components/configButton.jsx";
import "./RecordingPage.css";

function RecordingPage() {
  return (
    <div>
      <header className="header-content">
        <div className="header-container">
          <p>Grabando</p>
          <div className="bttnSettings">
            <ButtonSettings
              Children={"Configuraciones"}
              onclick={() => (window.location.href = "/config")}
            ></ButtonSettings>
          </div>
        </div>
      </header>
      <main className="main-content">
        <div className="main-container">
          <p>¡Tu sesión de estudio ha comenzado!</p>
        </div>
        <div className="background-glow"></div>

        <div className="subject-section">
          <label className="subject-label">Materia Actual</label>
          <div className="subject-selector">
            <div className="subject-content">
              <span className="subject-indicator"></span>
              <span className="subject-name">Programación Avanzada</span>
              <span className="material-icons-round subject-arrow">
                arrow_drop_down
              </span>
            </div>
          </div>
        </div>

        <div className="recording-info">
          <div className="time-section">
            <div className="time-display">00:42:15</div>
            <p className="time-label">Tiempo transcurrido</p>
          </div>

          <div className="waveform-container">
            <div className="wave-bar opacity-40"></div>
            <div className="wave-bar opacity-60"></div>
            <div className="wave-bar opacity-80"></div>
            <div className="wave-bar opacity-100"></div>
            <div className="wave-bar primary"></div>
            <div className="wave-bar primary"></div>
            <div className="wave-bar primary highlighted"></div>
            <div className="wave-bar primary"></div>
            <div className="wave-bar primary"></div>
            <div className="wave-bar opacity-100"></div>
            <div className="wave-bar opacity-80"></div>
            <div className="wave-bar opacity-60"></div>
            <div className="wave-bar opacity-40"></div>
          </div>

          <div className="live-indicator">
            <span className="live-dot"></span>
            En Vivo
          </div>
        </div>

        <div className="controls-panel">
          <div className="flag-button-container">
            <button className="flag-button">
              <span className="material-icons-round">flag</span>
              <span>Marcar punto importante</span>
            </button>
          </div>

          <div className="action-buttons">
            <button className="action-btn">
              <div className="action-icon">
                <span className="material-icons-round">pause</span>
              </div>
              <span className="action-label">Pausar</span>
            </button>

            <button className="action-btn stop-btn">
              <div className="action-icon stop-icon">
                <div className="stop-square"></div>
              </div>
              <span className="action-label stop-label">Detener</span>
            </button>

            <button className="action-btn">
              <div className="action-icon">
                <span className="material-icons-round">delete_outline</span>
              </div>
              <span className="action-label">Cancelar</span>
            </button>
          </div>
        </div>
      </main>
      <div className="recording-container">
        <p>Tiempo de estudio: 00:00:00</p>
      </div>
    </div>
  );
}

export default RecordingPage;
