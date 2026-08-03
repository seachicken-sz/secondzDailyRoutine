(() => {
  const style = document.createElement("style");
  style.id = "firstGuideMobileStyles";
  style.textContent = `
    @media (max-width: 699px) {
      .first-guide-section .guide-step-list {
        gap: 0;
      }

      .first-guide-section .guide-step-card {
        overflow: visible;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
      }

      .first-guide-section .guide-step-card + .guide-step-card {
        margin-top: 28px;
        padding-top: 28px;
        border-top: 1px solid var(--color-border);
      }

      .first-guide-section .guide-step-heading {
        align-items: center;
        gap: 10px;
      }

      .first-guide-section .guide-step-heading > div {
        min-width: 0;
      }

      .first-guide-section .guide-step-heading h3 {
        margin: 0;
      }

      .first-guide-section .guide-step-note {
        margin-right: 0;
        margin-left: 0;
      }

      .first-guide-section .guide-service-grid {
        gap: 0;
        margin-top: 14px;
      }

      .first-guide-section .service-data-card {
        overflow: visible;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
      }

      .first-guide-section .service-data-card:first-child {
        padding-top: 18px;
        border-top: 1px dashed var(--color-border);
      }

      .first-guide-section .service-data-card + .service-data-card {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px dashed var(--color-border);
      }

      .first-guide-section .service-data-card-heading {
        gap: 8px;
      }

      .first-guide-section .service-data-card h4 {
        font-size: 15px;
      }

      .first-guide-section .service-data-card .service-info-button {
        margin-top: 10px;
      }

      .first-guide-section .service-data-card .card-download-footer {
        padding-top: 10px;
      }

      #resultSection .result-cards {
        gap: 0;
      }

      #resultSection .result-card {
        overflow: visible;
        padding: 18px 0 0;
        border: 0;
        border-top: 1px dashed var(--color-border);
        border-radius: 0;
        background: transparent;
      }

      #resultSection .result-card + .result-card {
        margin-top: 18px;
      }

      #resultSection .result-card-top {
        align-items: center;
      }

      #resultSection .result-card .card-download-footer {
        padding-top: 10px;
      }
    }
  `;
  document.head.appendChild(style);
})();
