# Swingway Fence Planner

Привет! Сделай из этого ZIP-архива полноценный работающий сайт. Это калькулятор-анкета для заказа ограждений и ворот на React и Tailwind CSS.

Пожалуйста, разверни проект, проверь работоспособность кода и примени к нему следующие важные настройки:

Размер картинок калитки: В папку ресурсов добавлены 4 картинки схем открывания: vnutri-leva.png, vnutri-prava.png, naruzhu-leva.png, naruzhu-prava.png. Их физический размер строго 335x215 пикселей.

Отображение в анкете: На шаге выбора калитки замени текстовые кнопки на визуальные карточки с этими изображениями. Расположи их в аккуратную сетку 2х2. Задай карточкам фиксированный размер width: 335px; height: 215px;, чтобы они не растягивались на весь экран. Дублирующий текст под картинками делать не нужно.

Отображение в чеке: В финальном всплывающем окне «Итоговый заказ» и при выводе на печать в PDF показывай выбранную картинку схемы точно такого же уменьшенного размера: 335x215 пикселей. Размеры в анкете и в итоговом чеке должны быть абсолютно одинаковыми.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swingway-fence-planner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ec0b0b9a-8da9-4d21-bab6-92025c43e5ed).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
