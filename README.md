# AlliancePay NodeJS SDK

Це офіційне NodeJS SDK для інтеграції з платіжними методами HPP сервісу https://docs.merchant.alb.ua/platizhni-metodi-hpp **AlliancePay**. SDK дозволяє легко виконувати авторизацію, створювати замовлення, обробляти вебхуки та керувати транзакціями через єдину точку входу — клас `AllianceBankClient`.

---

## Технічні вимоги

Перед початком роботи переконайтеся, що ваше середовище відповідає наступним вимогам:

* **Node.js:** версія `18.x` або вище.
* **TypeScript:** рекомендовано для повної підтримки типізації.

---

## Встановлення

Встановіть пакет за допомогою вашого пакетного менеджера:

```bash
npm install alliance-payment-hpp-integration-sdk
```

### 1. Ініціалізація та Авторизація
Для роботи з SDK необхідно створити екземпляр класу AllianceBankClient. Він автоматично керує станом токенів та їх оновленням за допомогою `RetryHttpClient` та внутрішнього сервісу авторизації.

Приклад ініціалізації:
```typescript
import { AllianceBankClient, AllianceSDKConfig } from 'alliance-payment-hpp-integration-sdk';

const config: AllianceSDKConfig = {
    authentificationData: {
        baseUrl: 'https://api-ecom-prod.bankalliance.ua/', // Базовий URL сервісу надається банком
        merchantId: 'YOUR_MERCHANT_ID', 
        serviceCode: 'YOUR_SERVICE_CODE', 
        authenticationKey: 'YOUR_AUTH_KEY' // Надається банком
    },
    // ВАЖЛИВО: Використовуйте цей колбек для збереження оновлених токенів у вашій базі даних
    onTokenUpdate: async (updatedAuth) => {
        // Наприклад: await db.saveAuthToken(updatedAuth);
    }
};

const client = new AllianceBankClient(config);
```
#### Особливість архітектури: 
SDK використовує Lazy Loading (ліниву ініціалізацію). 
Внутрішні сервіси створюються лише в момент першого виклику, що робить клієнт максимально легким та економить пам'ять.

### 2. Створення замовлення
Для створення платежу використовуйте метод `createOrder`. 
SDK автоматично додає ваш `merchantId` та генерує унікальний `merchantRequestId` для кожного запиту.

#### Приклад коду:
```typescript
const orderData = {
    coinAmount: 10050, // Сума в копійках
    hppPayType: 'PURCHASE',
    paymentMethods: ['CARD', 'APPLE_PAY', 'GOOGLE_PAY'],
    successUrl: 'https://your-site.com/success',
    failUrl: 'https://your-site.com/fail',
    statusPageType: 'STATUS_TIMER_PAGE',
    customerData: { senderCustomerId: 'customer_id_1' },
};

try {
    const response = await client.createOrder(orderData);
    console.log('Redirect to payment:', response.redirectUrl);
} catch (error) {
    console.error('Order creation failed:', error);
}
```

#### Вибір валюти (UAH / USD / EUR)
За замовчуванням замовлення створюється в **UAH**. Щоб створити замовлення в іншій валюті, передайте
опціональне поле `currencyCode`:

| Валюта | `currencyCode` |
|--------|-----------------|
| UAH (за замовчуванням) | `980` |
| USD | `840` |
| EUR | `978` |

```typescript
// Замовлення в USD
const orderDataUsd = {
    coinAmount: 1050, // Сума в мінімальних одиницях валюти (тут — центи USD)
    currencyCode: 840, // USD
    hppPayType: 'PURCHASE',
    paymentMethods: ['CARD', 'APPLE_PAY', 'GOOGLE_PAY'],
    successUrl: 'https://your-site.com/success',
    failUrl: 'https://your-site.com/fail',
    statusPageType: 'STATUS_TIMER_PAGE',
    customerData: { senderCustomerId: 'customer_id_1' },
};

// Замовлення в EUR — так само, лише інший код валюти
const orderDataEur = { ...orderDataUsd, currencyCode: 978 }; // EUR

try {
    const response = await client.createOrder(orderDataUsd);
    console.log('Redirect to payment:', response.redirectUrl);
} catch (error) {
    console.error('Order creation failed:', error);
}
```

> **Важливо:** платежі типу `hppPayType: 'A2A'` підтримують лише UAH (`currencyCode: 980`).
> Якщо передати `840`/`978` разом з `A2A`, SDK кине `ValidationException` ще до відправки запиту в банк.

### 3. Обробка зворотних викликів (Callback/Webhook)
Для автоматичної обробки повідомлень від платіжного шлюзу використовуйте метод `handleCallback`. 
Він бере на себе перевірку валідності даних та їх дешифрування.

Поле `callbackDto.operation.type` визначає тип операції: `'PURCHASE'`, `'REFUND'`, `'PREAUTH'`, `'COMPLETION'` або `'ACCOUNT_2_ACCOUNT'`.

#### Приклад використання (Express.js):
```typescript
app.post('/api/payment/callback', async (req, res) => {
    try {
        // Очікується, що req.body вже є розпарсеним JSON об'єктом
        const callbackDto = await client.handleCallback(req.body);
        const { operation } = callbackDto;

        if (operation.type === 'PURCHASE' && operation.status === 'SUCCESS') {
            // Обробіть успішний платіж у вашій системі
            console.log('Payment successful for order:', callbackDto.ecomOrderId);
        }

        if (operation.type === 'PREAUTH' && operation.status === 'SUCCESS') {
            // Кошти заморожено — збережіть operationId для виконання COMPLETION
            console.log('PREAUTH successful, operationId:', operation.operationId);
            // await db.savePreauthOperationId(callbackDto.hppOrderId, operation.operationId);
        }

        if (operation.type === 'COMPLETION' && operation.status === 'SUCCESS') {
            // Кошти успішно списано
            console.log('COMPLETION successful for order:', callbackDto.ecomOrderId);
            console.log('Original PREAUTH operationId:', operation.preauthOperationId);
            console.log('Original PREAUTH amount (coins):', operation.preauthCoinAmount);
        }

        // Повертаємо 200 OK сервісу AlliancePay
        res.status(200).send('OK');
    } catch (error) {
        // Логування помилки та відповідь з помилкою
        console.error('Callback handling error:', error);
        res.status(400).send('Error');
    }
});
```

### 4. Повернення коштів (Refund)
Метод `createRefund` автоматично формує дату у потрібному форматі та ініціює запит на повернення коштів.
Ви можете ініціювати як повне, так і часткове повернення.

#### Приклад виконання Refund:
```typescript
try {
    const refundResponse = await client.createRefund({
        operationId: 'ORIGINAL_OPERATION_ID', // ID успішної операції по створенню замовлення
        coinAmount: 500, // Сума повернення в копійках
        merchantComment: 'Повернення товару клієнтом'
    });
    console.log('Refund status:', refundResponse.status);
} catch (error) {
    console.error('Refund failed:', error);
}
```

#### Повернення суми в іноземній валюті
Якщо оригінальний платіж був у USD/EUR, замість `coinAmount` можна передати `sourceAmount`
(сума в основних одиницях валюти, напр. `10.5` USD) та `conversionRate` (курс до UAH) — SDK сам
порахує суму повернення в копійках UAH: `coinAmount = round(sourceAmount * conversionRate * 100)`.

```typescript
try {
    const refundResponse = await client.createRefund({
        operationId: 'ORIGINAL_OPERATION_ID',
        sourceAmount: 10.5,     // Сума повернення в USD/EUR
        conversionRate: 41.2,   // Курс конвертації в UAH на момент операції
        merchantComment: 'Повернення товару клієнтом'
    });
    console.log('Refund status:', refundResponse.status);
} catch (error) {
    console.error('Refund failed:', error);
}
```

> `coinAmount` та пара `sourceAmount`/`conversionRate` — взаємовиключні способи задати суму.
> Якщо передані обидва `sourceAmount` і `conversionRate`, вони мають пріоритет і `coinAmount`
> обчислюється з них автоматично.

### 5. Попередня авторизація (PREAUTH)
PREAUTH дозволяє заморозити кошти на картці клієнта без їх фактичного списання. Кошти утримуються до моменту виконання COMPLETION або закінчення терміну дії авторизації.

Для ініціювання передайте `hppPayType: 'PREAUTH'` у метод `createOrder`. SDK автоматично встановить `preAuthExpDate` (поточний час + 2 години 30 секунд), якщо ви не передасте це поле явно.

> **`preAuthExpDate`** — необов'язковий параметр. Якщо передаєте вручну, дотримуйтеся формату `YYYY-MM-DD HH:mm:ss.SS±HH:MM` (наприклад, `2025-11-13 15:01:54.56+02:00`). Значення має бути не раніше ніж через 2 години та не пізніше ніж через 28 днів від поточного моменту.

#### Приклад ініціювання PREAUTH:
```typescript
// SDK автоматично встановить preAuthExpDate = тепер + 2год 30сек
const orderData = {
    coinAmount: 25000, // Сума в копійках
    hppPayType: 'PREAUTH',
    paymentMethods: ['CARD'],
    successUrl: 'https://your-site.com/success',
    failUrl: 'https://your-site.com/fail',
    statusPageType: 'STATUS_TIMER_PAGE',
    customerData: { senderCustomerId: 'customer_id_1' },
};

// Або із явно заданим терміном дії авторизації (від +2год до +28 днів від поточного моменту):
const orderDataWithExpDate = {
    ...orderData,
    preAuthExpDate: '2025-11-13 15:01:54.56+02:00',
};

try {
    const response = await client.createOrder(orderData);
    console.log('Redirect to payment page:', response.redirectUrl);
    // Зберігаємо hppOrderId для подальшої перевірки статусу
    console.log('HPP Order ID:', response.hppOrderId);
} catch (error) {
    console.error('PREAUTH order creation failed:', error);
}
```

Після того як клієнт підтвердить авторизацію на сторінці оплати, сервіс надішле callback із `operation.type === 'PREAUTH'`. Збережіть `operationId` з тіла callback — він знадобиться для виконання COMPLETION (див. розділ 3).

### 6. Завершення авторизації (COMPLETION)
COMPLETION списує кошти, заморожені попередньою PREAUTH-операцією. Сума списання може відрізнятися від суми попередньої авторизації не більше ніж на **±20%**.

Метод `createCompletion` приймає два аргументи:
1. Об'єкт із даними операції — `originalOperationId`, `coinAmount` та опціонально `notificationUrl`.
2. `originalCoinAmount` — сума оригінальної PREAUTH-операції в копійках. Використовується для перевірки допустимого діапазону списання.

SDK автоматично додає `merchantId`, `merchantRequestId` та `date`.

#### Приклад виконання COMPLETION:
```typescript
import { CompletionAmountException, AllianceSdkException } from 'alliance-payment-hpp-integration-sdk';

const originalCoinAmount = 25000; // Сума оригінальної PREAUTH в копійках

try {
    const completionResponse = await client.createCompletion(
        {
            originalOperationId: 'PREAUTH_OPERATION_ID', // operationId з callback PREAUTH
            coinAmount: 24000, // Сума списання (в межах ±20% від 25000: 20000–30000)
            notificationUrl: 'https://your-site.com/api/completion-callback', // Опціонально
        },
        originalCoinAmount
    );

    console.log('Completion status:', completionResponse.status);
    console.log('ecomOperationId:', completionResponse.ecomOperationId);
    console.log('Original PREAUTH operationId:', completionResponse.preauthOperationId);
    console.log('Original PREAUTH amount (coins):', completionResponse.preauthCoinAmount);
} catch (error) {
    if (error instanceof CompletionAmountException) {
        // Сума виходить за межі ±20% від оригінальної PREAUTH
        console.error('Amount out of allowed range:', error.message);
    } else if (error instanceof AllianceSdkException) {
        console.error(`Bank Error Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

#### Списання суми в іноземній валюті
Так само, як і для Refund, замість `coinAmount` можна передати `sourceAmount` + `conversionRate` —
SDK автоматично конвертує суму списання в копійки UAH перед перевіркою діапазону ±20% та відправкою запиту.

```typescript
const originalCoinAmount = 25000; // Сума оригінальної PREAUTH в копійках UAH

try {
    const completionResponse = await client.createCompletion(
        {
            originalOperationId: 'PREAUTH_OPERATION_ID',
            sourceAmount: 9.6,      // Сума списання в USD/EUR
            conversionRate: 41.2,   // Курс конвертації в UAH на момент операції
            notificationUrl: 'https://your-site.com/api/completion-callback', // Опціонально
        },
        originalCoinAmount
    );

    console.log('Completion status:', completionResponse.status);
} catch (error) {
    if (error instanceof CompletionAmountException) {
        console.error('Amount out of allowed range:', error.message);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

> **`originalCoinAmount`** (другий аргумент) завжди залишається в копійках **UAH** — незалежно від
> валюти списання, це сума оригінальної PREAUTH-операції, і саме з нею SDK порівнює
> UAH-еквівалент суми COMPLETION при перевірці діапазону ±20%.

### 7. Перевірка статусу замовлення
Якщо вам потрібно вручну перевірити поточний стан транзакції 
(наприклад, за кроном або якщо користувач закрив сторінку оплати), 
використовуйте метод `checkOrderData` з передачею `hppOrderId`.

#### Приклад перевірки статусу:
```typescript
try {
    const orderData = await client.checkOrderData('HPP_ORDER_ID_HERE');
    
    console.log('Current order status:', orderData.orderStatus);
    console.log('Operations history:', orderData.operations); // Масив усіх спроб оплати та повернень
} catch (error) {
    console.error('Status check failed:', error);
}
```

### 8. Обробка специфічних помилок (Exceptions)
SDK використовує типізовані помилки для точного визначення причини відмови.

| Клас помилки                 | Опис |
|------------------------------| -------- |
| `ValidationException`        | Дані не пройшли перевірку за схемою DTO (відсутні обов'язкові поля або невірний тип).  |
| `AuthorizationException`     | Помилки авторизації, невірні ключі або прострочені сесії. |
| `PaymentException`           | Помилки на рівні платіжної логіки (наприклад, недостатньо коштів для повернення). |
| `CompletionException`        | Помилки HTTP, шифрування або API під час виконання COMPLETION. |
| `CompletionAmountException`  | Сума COMPLETION виходить за межі ±20% від суми оригінальної PREAUTH. |
| `AllianceSdkException`       | Базовий клас для всіх кастомних помилок SDK. |

#### Приклад перевірки помилок:
```typescript
import { ValidationException, AllianceSdkException } from 'alliance-payment-hpp-integration-sdk';

try {
    await client.createOrder(orderData);
} catch (error) {
    if (error instanceof ValidationException) {
        // error.errors містить масив усіх знайдених помилок валідації DTO
        console.error('Validation errors:', error.errors);
    } else if (error instanceof AllianceSdkException) {
        // Обробка бізнес-помилок банку
        console.error(`Bank Error Code: ${error.code}`); // напр. 'b_terminal_not_found'
        console.error(`Message: ${error.message}`);
        console.error(`Raw Response Data:`, error.originalError); // Тіло відповіді банку
    } else {
        console.error('Unexpected system error:', error);
    }
}
```
