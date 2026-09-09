# Facebook Group Post Scheduling Flow

This document outlines the exact steps to create and schedule a Facebook group post using MCP Playwright tools, as demonstrated in the LDM Bot project.

## Prerequisites
- Logged into Facebook as Netto Farias (or any admin) in the browser context.
- Already navigated to the Facebook group: "A Loja Do Mecânico" (https://www.facebook.com/groups/tokeniza).

## Step-by-Step Flow

### 1. Open Composer
- **Action**: Click the button to open the composer.
- **Selector**: `button[name="Escreva algo..."]`
- **Tool**: `playwright_browser_click`
- **Note**: If a dark mode overlay (`.__fb-dark-mode`) is present and blocks clicks, remove it first:
  ```js
  await page.evaluate(() => document.querySelector('.__fb-dark-mode')?.remove());
  ```

### 2. Fill Post Text
- **Action**: Type the main text content into the post textbox.
- **Selector**: After composer opens, the textbox appears with `role="textbox"`.
- **Tool**: `playwright_browser_fill_form` (or `playwright_browser_type` with the textbox target).
- **Example Text**: 
  ```
  Teste de agendamento - produto: Maquina de solda inversora MIG 0 sem gas 120a Bivolt
  https://www.lojadomecanico.com.br/produto/621944/98/1045/maquina-de-solda-inversora-multiprocesso-mig-0-sem-gas-120a-bivolt-com-mascara-de-solda-optiarc-70-boxer-99086/20889
  @todos
  ```
  (The `@todos` mention will be handled in the next step.)

### 3. Insert Affiliate Link
- **Action**: Paste the affiliate URL into the textbox (can be part of the text above).
- **Note**: Facebook automatically generates a link preview after detecting a URL.

### 4. Wait for Link Preview
- **Action**: Wait for the link preview to appear (optional but recommended).
- **Indicator**: Look for elements containing the product title, image, price, etc. (e.g., a blockquote with the product description).
- **Tool**: `playwright_browser_wait_for` with a text snippet from the preview, or simply add a short delay.

### 5. Add @Todos Mention
- **Action**: Type `@` to trigger the mention suggestions, then select the "todos" option.
- **Selector**: 
  - First, type `@` in the textbox.
  - Then, click the suggestion item with name containing "todos".
- **Tool**: 
  - `playwright_browser_type` with text `@` (slowly to trigger suggestions).
  - `playwright_browser_click` on the suggestion element (ref obtained via snapshot or using role/name).
- **Alternative**: If the suggestion appears in a listbox, use `getByRole('option', { name: /todos/i })`.

### 6. Open Scheduling Dialog
- **Action**: Click the "Programar post" button to open the scheduling dialog.
- **Selector**: `button[name="Programar post"]`
- **Tool**: `playwright_browser_click`
- **Note**: This button is enabled only after some content (text or link) is present in the composer.

### 7. Select Date
- **Action**: Open the date picker and choose a future date.
- **Substeps**:
  a. Click the date combobox: `combobox[name="Abrir seletor de data"]`
  b. In the date grid, click the desired day (e.g., `gridcell[name="Quinta, 17 de setembro de"]`).
- **Tools**: Two `playwright_browser_click` calls.

### 8. Select Time
- **Action**: Open the time picker and choose a future time.
- **Substeps**:
  a. Click the time combobox: `combobox[name="Abrir seletor de hora"]`
  b. In the time listbox, click the desired time option (e.g., `option[name="10:30"]`).
- **Tools**: Two `playwright_browser_click` calls.

### 9. Confirm Scheduling
- **Action**: Click the "Programar" button to schedule the post.
- **Selector**: `button[name="Programar"]`
- **Tool**: `playwright_browser_click`
- **Note**: The button becomes enabled after both date and time are selected.

### 10. Verify Scheduled Post
- **Action**: Navigate to the scheduled posts list and verify the entry appears.
- **Substeps**:
  a. Click the "Posts programados" link in the group admin navigation (e.g., `link[name="Posts programados"]`).
  b. On the scheduled posts page, locate the post entry by checking:
     - Author name (Netto Farias)
     - Scheduled date and time (e.g., "17 de setembro às 10:30")
     - Content snippet (e.g., "Teste de agendamento - produto: Maquina de solda inversora MIG 0 sem gas 120a Bivolt")
     - Presence of action buttons like "Reprogramar post" and "Postar agora".
- **Tool**: Use `playwright_browser_snapshot` or `playwright_browser_find` to confirm.

## Additional Notes
- **Dark Mode Overlay**: If present, remove via `page.evaluate(() => document.querySelector('.__fb-dark-mode')?.remove())` before clicking any interactive element.
- **Waiting**: Use explicit waits for elements to appear (e.g., wait for the scheduling dialog to appear after clicking "Programar post").
- **Error Handling**: If any step fails, take a screenshot and log the error for debugging.
- **Idempotency**: The flow can be repeated to schedule multiple posts; ensure each post has unique content or timing to avoid duplication.

## Example Playwright Script Pseudocode
```javascript
// Remove dark mode overlay if needed
await page.evaluate(() => document.querySelector('.__fb-dark-mode')?.remove());

// Open composer
await page.getByRole('button', { name: 'Escreva algo...' }).click();

// Fill textbox (combine text, link, and mention)
const textbox = page.getByRole('textbox');
await textbox.fill(`Teste de agendamento - produto: Maquina de solda inversora MIG 0 sem gas 120a Bivolt
https://www.lojadomecanico.com.br/produto/621944/98/1045/maquina-de-solda-inversora-multiprocesso-mig-0-sem-gas-120a-bivolt-com-mascara-de-solda-optiarc-70-boxer-99086/20889
@`);
// Trigger mention suggestions by typing @ (already done) then wait and select
await page.waitForTimeout(500); // allow suggestions to appear
await page.getByRole('option', { name: /todos/i }).click();

// Open scheduling dialog
await page.getByRole('button', { name: 'Programar post' }).click();

// Select date (example: tomorrow)
await page.getByRole('combobox', { name: 'Abrir seletor de data' }).click();
await page.getByRole('gridcell', { name: /Quinta, 17 de setembro de/ }).click(); // adjust date as needed

// Select time
await page.getByRole('combobox', { name: 'Abrir seletor de hora' }).click();
await page.getByRole('option', { name: '10:30' }).click();

// Confirm scheduling
await page.getByRole('button', { name: 'Programar' }).click();

// Wait for dialog to close (optional)
await page.waitForTimeout(1000);

// Navigate to scheduled posts to verify
await page.getByRole('link', { name: /Posts programados/ }).click();
// Verify post entry appears...
```

## Outcome
The post is successfully scheduled and appears in the group's scheduled posts list with the correct date, time, content, and affiliate link preview.