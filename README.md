# StarRating PCF — Power Apps Component Framework

A PCF component for Dynamics 365 and Power Apps that replaces numeric fields with a visual star rating interface, a comment field, and dynamic record cards loaded from a JSON field.

## Features

- 1 to 5 star rating with visual feedback
- Comment field with debounce (notifies Power Apps 800ms after the user stops typing)
- Dynamic record cards loaded via a JSON field
- Configurable copy button per record
- Native Fluent UI styling matching Dynamics 365 design tokens

## Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `value` | Whole Number | Yes | Rating from 1 to 5 |
| `comment` | Single Line Text | No | User comment |
| `recordsJson` | Multiple (Text) | No | JSON array of record cards |

## JSON Structure (`recordsJson`)

```json
[
  {
    "id": "1",
    "text": "Record text",
    "color": "#0078d4",
    "copyEnabled": true
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier for the record |
| `text` | string | Text displayed on the card |
| `color` | string | Background color in hex |
| `copyEnabled` | boolean | Shows or hides the copy button |

## Prerequisites

- Node.js (LTS)
- Power Platform CLI (`pac`)
- Power Platform / Dynamics 365 environment

## Installation

```bash
# Install dependencies
npm install

# Test locally
npm start

# Production build
npm run build -- --buildMode production
```

## Deploy

```bash
# Authenticate to your environment
pac auth create --url https://yourenv.crm.dynamics.com

# Direct deploy (development)
pac pcf push --publisher-prefix xx
```

## Form Configuration

1. Create the table columns:
   - `rating_value` → Whole Number
   - `rating_comment` → Single Line of Text
   - `rating_json` → Multiline Text

2. Add the `rating_value` field to the form

3. On the field → **Components** → **+ Add component** → select `StarRating`

4. Map the properties:
   - `value` → `rating_value`
   - `comment` → `rating_comment`
   - `recordsJson` → `rating_json`

5. Hide the `rating_comment` and `rating_json` fields from the form

6. Save and publish

## Component Lifecycle

```
Form opens → init() → renderStars()
                          ↓
User clicks star → notifyOutputChanged() → getOutputs() → Dynamics saves
                          ↓
User types comment → debounce 800ms → notifyOutputChanged() → getOutputs()
                          ↓
JSON field updated → updateView() → renderStars() → renderRecords()
```

## Technologies

- TypeScript
- Power Apps Component Framework (PCF)
- Fluent UI (native Dynamics 365 design tokens)

## Author

Lucas Teixeira de Jesus — [lucasjesus0311](https://github.com/lucasjesus0311)
