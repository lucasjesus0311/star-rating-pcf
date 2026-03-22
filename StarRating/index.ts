/**
 * StarRating — PCF (Power Apps Component Framework)
 *
 * Este componente substitui campos numéricos e de texto no Dynamics 365 /
 * Power Apps por uma interface visual de avaliação com estrelas, campo de
 * comentário e cards de registros dinâmicos vindos de um JSON.
 *
 * Propriedades mapeadas no formulário:
 *  - value       → campo numérico (Whole Number) — nota de 1 a 5
 *  - comment     → campo de texto (Single Line)  — comentário do usuário
 *  - recordsJson → campo de texto longo (Multiple) — JSON com cards
 */

// IInputs e IOutputs são interfaces geradas automaticamente pelo build
// a partir do ControlManifest.Input.xml — definem os tipos das propriedades
import { IInputs, IOutputs } from "./generated/ManifestTypes";

// A classe implementa a interface padrão do PCF
// ComponentFramework.StandardControl<IInputs, IOutputs> obriga a classe
// a ter os 4 métodos do ciclo de vida: init, updateView, getOutputs, destroy
export class StarRating implements ComponentFramework.StandardControl<IInputs, IOutputs> {

  // Referência ao elemento HTML raiz onde o componente é renderizado
  // O Dynamics injeta esse container no formulário
  private _container: HTMLDivElement;

  // Armazena a nota atual (1 a 5) em memória
  // Atualizado ao clicar em uma estrela
  private _currentValue: number;

  // Armazena o texto do comentário em memória
  // Atualizado enquanto o usuário digita (via debounce)
  private _currentComment: string;

  // Armazena o JSON bruto dos cards vindos do campo do formulário
  // Exemplo: [{ "id":"1", "text":"...", "color":"#fff", "copyEnabled":true }]
  private _recordsJson: string;

  // Função fornecida pelo Dynamics para avisar que o valor mudou
  // Quando chamada, o Dynamics executa getOutputs() para buscar o novo valor
  private _notifyOutputChanged: () => void;

  /**
   * init — Ciclo de vida #1
   *
   * Chamado UMA ÚNICA VEZ quando o componente é carregado no formulário.
   * Responsável por: configurar variáveis, registrar callbacks e
   * fazer a primeira renderização.
   *
   * @param context             — objeto com todos os dados do formulário e utilitários do PCF
   * @param notifyOutputChanged — callback para avisar o Dynamics que o valor mudou
   * @param state               — estado persistido entre sessões (não usado aqui)
   * @param container           — elemento HTML onde o componente será renderizado
   */
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    // Salva o container para uso nos métodos de renderização
    this._container = container;

    // Aplica a classe CSS raiz para estilização com padrão Fluent UI
    this._container.classList.add("star-rating-container");

    // Salva o callback — será chamado sempre que o usuário interagir
    this._notifyOutputChanged = notifyOutputChanged;

    // Lê os valores iniciais dos campos mapeados no formulário
    // O operador ?? garante um valor padrão caso o campo esteja vazio
    this._currentValue   = context.parameters.value.raw       ?? 0;
    this._currentComment = context.parameters.comment.raw     ?? "";
    this._recordsJson    = context.parameters.recordsJson.raw ?? "[]";

    // Primeira renderização do componente
    this.renderStars();
  }

  /**
   * updateView — Ciclo de vida #2
   *
   * Chamado pelo Dynamics toda vez que um valor do formulário muda
   * (qualquer campo, não só os mapeados neste componente).
   * Deve sincronizar o estado interno com os novos valores e re-renderizar.
   *
   * @param context — objeto atualizado com os valores mais recentes do formulário
   */
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // Atualiza todas as variáveis internas com os valores mais recentes
    this._currentValue   = context.parameters.value.raw       ?? 0;
    this._currentComment = context.parameters.comment.raw     ?? "";
    this._recordsJson    = context.parameters.recordsJson.raw ?? "[]";

    // Re-renderiza o componente com os novos valores
    this.renderStars();
  }

  /**
   * getOutputs — Ciclo de vida #3
   *
   * Chamado pelo Dynamics logo após notifyOutputChanged() ser executado.
   * Deve retornar os valores atuais que serão gravados nos campos do formulário.
   * O retorno deve bater com as propriedades de tipo "bound" do manifest.
   */
  public getOutputs(): IOutputs {
    return {
      value:   this._currentValue,   // → gravado no campo rating_value
      comment: this._currentComment  // → gravado no campo rating_comment
    };
  }

  /**
   * destroy — Ciclo de vida #4
   *
   * Chamado quando o componente é removido do formulário.
   * Use para limpar event listeners, timers ou conexões abertas.
   * Aqui não há recursos externos para liberar.
   */
  public destroy(): void {
    // Nenhum recurso externo para liberar neste componente
  }

  /**
   * renderStars — método privado de renderização principal
   *
   * Reconstrói todo o DOM do componente do zero.
   * Chamado no init (primeira vez) e no updateView (atualizações).
   *
   * Estrutura gerada:
   *  container
   *  ├── span.star (x5)     — estrelas clicáveis
   *  ├── textarea           — campo de comentário
   *  ├── hr.divider         — separador visual
   *  └── renderRecords()    — cards de registros
   */
  private renderStars(): void {
    // Limpa o DOM anterior antes de re-renderizar
    // Garante que não haverá elementos duplicados
    this._container.innerHTML = "";

    // ── Estrelas ──────────────────────────────────────────────
    // Cria 5 estrelas numeradas de 1 a 5
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");

      // ★ = estrela preenchida (ativa), ☆ = estrela vazia (inativa)
      star.innerText = i <= this._currentValue ? "★" : "☆";

      // Classe base + classe de estado (active/inactive)
      // O CSS usa essas classes para aplicar as cores corretas
      star.classList.add("star-rating-star");
      star.classList.add(i <= this._currentValue ? "active" : "inactive");

      // Ao clicar: atualiza o valor, notifica o Dynamics e re-renderiza
      star.onclick = () => {
        this._currentValue = i;
        this._notifyOutputChanged(); // avisa o Dynamics → ele chama getOutputs()
        this.renderStars();          // re-renderiza para refletir a nova nota
      };

      this._container.appendChild(star);
    }

    // ── Textarea de comentário ────────────────────────────────
    const textarea = document.createElement("textarea");
    textarea.value       = this._currentComment;
    textarea.placeholder = "Deixe um comentário...";
    textarea.classList.add("star-rating-textarea");

    // Timer do debounce — evita chamar notifyOutputChanged a cada tecla
    // A variável fica fora do evento para persistir entre chamadas
    let debounceTimer: ReturnType<typeof setTimeout>;

    textarea.oninput = () => {
      // Atualiza a variável interna imediatamente a cada tecla
      this._currentComment = textarea.value;

      // Cancela o timer anterior (se o usuário ainda estiver digitando)
      clearTimeout(debounceTimer);

      // Só notifica o Dynamics 800ms após a última tecla pressionada
      // Evita re-renderizações enquanto o usuário está digitando
      debounceTimer = setTimeout(() => {
        this._notifyOutputChanged();
      }, 800);
    };

    this._container.appendChild(textarea);

    // ── Divisor visual ────────────────────────────────────────
    // Linha horizontal separando o comentário dos cards de registros
    const divider = document.createElement("hr");
    divider.classList.add("star-rating-divider");
    this._container.appendChild(divider);

    // ── Cards de registros ────────────────────────────────────
    // Delega a renderização dos cards para o método específico
    this.renderRecords();
  }

  /**
   * renderRecords — método privado para renderizar os cards do JSON
   *
   * Lê o JSON do campo recordsJson, faz o parse e cria um card
   * para cada registro. Cada card pode ter cor e botão de copiar
   * configurados individualmente pelo JSON.
   *
   * Estrutura esperada do JSON:
   * [
   *   {
   *     "id": "1",               — identificador único do registro
   *     "text": "...",           — texto exibido no card
   *     "color": "#0078d4",      — cor de fundo em hex
   *     "copyEnabled": true      — exibe ou oculta o botão de copiar
   *   }
   * ]
   */
  private renderRecords(): void {
    // Define o tipo de cada item do JSON para o TypeScript validar
    let records: { id: string; text: string; color: string; copyEnabled: boolean }[] = [];

    try {
      // Converte a string JSON em array de objetos
      records = JSON.parse(this._recordsJson);
    } catch {
      // Se o JSON for inválido, encerra sem renderizar nada
      // Evita quebrar o componente por dados malformados
      return;
    }

    // Se o array estiver vazio, não renderiza o container
    if (records.length === 0) return;

    // Container que agrupa todos os cards
    const recordsContainer = document.createElement("div");
    recordsContainer.classList.add("star-rating-records");

    // Itera sobre cada registro do JSON e cria seu card
    records.forEach(record => {

      // ── Card ────────────────────────────────────────────────
      const card = document.createElement("div");
      card.classList.add("star-rating-card");

      // A cor de fundo vem do JSON — cada registro pode ter sua própria cor
      card.style.backgroundColor = record.color;

      // ── Texto do registro ───────────────────────────────────
      const text = document.createElement("span");
      text.innerText = record.text;
      text.classList.add("star-rating-card-text");
      card.appendChild(text);

      // ── Botão Copiar (condicional) ───────────────────────────
      // Só renderiza se "copyEnabled": true no JSON do registro
      if (record.copyEnabled) {
        const copyBtn = document.createElement("button");
        copyBtn.innerText = "Copiar";
        copyBtn.classList.add("star-rating-copy-btn");

        copyBtn.onclick = () => {
          // Clipboard API — copia o texto do registro para a área de transferência
          navigator.clipboard.writeText(record.text)
            .then(() => {
              // Feedback visual de sucesso — muda o texto do botão por 1.5s
              copyBtn.innerText = "Copiado ✓";
              return setTimeout(() => { copyBtn.innerText = "Copiar"; }, 1500);
            })
            .catch(() => {
              // Feedback visual de erro — ex: navegador bloqueou o clipboard
              copyBtn.innerText = "Erro ao copiar";
            });
        };

        card.appendChild(copyBtn);
      }

      recordsContainer.appendChild(card);
    });

    this._container.appendChild(recordsContainer);
  }
}
