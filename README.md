# StarRating PCF — Power Apps Component Framework

Componente PCF para Dynamics 365 e Power Apps que substitui campos numéricos por uma interface visual de avaliação com estrelas, campo de comentário e cards de registros dinâmicos via JSON.

## Funcionalidades

- Avaliação de 1 a 5 estrelas com feedback visual
- Campo de comentário com debounce (notifica o Power Apps 800ms após o usuário parar de digitar)
- Cards de registros dinâmicos carregados via campo JSON
- Botão de copiar configurável por registro
- Estilização com padrão nativo Fluent UI / Dynamics 365

## Propriedades

| Propriedade | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `value` | Whole Number | Sim | Nota de 1 a 5 |
| `comment` | Single Line Text | Não | Comentário do usuário |
| `recordsJson` | Multiple (Text) | Não | JSON com array de cards |

## Estrutura do JSON (`recordsJson`)

```json
[
  {
    "id": "1",
    "text": "Texto do registro",
    "color": "#0078d4",
    "copyEnabled": true
  }
]
```

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único do registro |
| `text` | string | Texto exibido no card |
| `color` | string | Cor de fundo em hex |
| `copyEnabled` | boolean | Exibe ou oculta o botão de copiar |

## Pré-requisitos

- Node.js (LTS)
- Power Platform CLI (`pac`)
- Ambiente Power Platform / Dynamics 365

## Instalação

```bash
# Instalar dependências
npm install

# Testar localmente
npm start

# Build de produção
npm run build -- --buildMode production
```

## Deploy

```bash
# Autenticar no ambiente
pac auth create --url https://seuambiente.crm.dynamics.com

# Deploy direto (desenvolvimento)
pac pcf push --publisher-prefix xx
```

## Configuração no Formulário

1. Criar os campos na tabela:
   - `rating_value` → Número Inteiro
   - `rating_comment` → Linha de Texto
   - `rating_json` → Texto Multilinha

2. Adicionar o campo `rating_value` ao formulário

3. No campo → **Componentes** → **+ Adicionar componente** → selecionar `StarRating`

4. Mapear as propriedades:
   - `value` → `rating_value`
   - `comment` → `rating_comment`
   - `recordsJson` → `rating_json`

5. Ocultar os campos `rating_comment` e `rating_json` do formulário

6. Salvar e publicar

## Ciclo de Vida do Componente

```
Formulário abre → init() → renderStars()
                              ↓
Usuário clica estrela → notifyOutputChanged() → getOutputs() → Dynamics salva
                              ↓
Usuário digita comentário → debounce 800ms → notifyOutputChanged() → getOutputs()
                              ↓
Campo JSON atualizado → updateView() → renderStars() → renderRecords()
```

## Tecnologias

- TypeScript
- Power Apps Component Framework (PCF)
- Fluent UI (tokens de design nativos do Dynamics 365)

## Autor

Lucas Teixeira de Jesus — [lucasjesus0311](https://github.com/lucasjesus0311)
