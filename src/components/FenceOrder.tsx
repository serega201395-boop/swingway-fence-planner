import { useEffect, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, ClipboardList, Fence, Plus, Printer, Trash2, X } from 'lucide-react';

type FenceRow = { id: string; quantity: string; width: string; height: string };
const wicketOpeningValues = [
  'Во двор, петли слева',
  'Во двор, петли справа',
  'На улицу, петли слева',
  'На улицу, петли справа',
] as const;
type WicketOpening = (typeof wicketOpeningValues)[number];
const wicketOpeningCards: { value: WicketOpening; image: string }[] = [
  { value: 'Во двор, петли слева', image: '/images/vnutri-leva.png' },
  { value: 'Во двор, петли справа', image: '/images/vnutri-prava.png' },
  { value: 'На улицу, петли слева', image: '/images/naruzhu-leva.png' },
  { value: 'На улицу, петли справа', image: '/images/naruzhu-prava.png' },
];
const swingOpeningCards = [
  { value: 'Наружу', image: '/images/vorota-naruzhu.png', label: 'Відкривання у двір (назовні)' },
  { value: 'Внутрь', image: '/images/vorota-vnutri.png', label: 'Відкривання у двір (внутрь)' },
];

const slidingDirectionCards = [
  { value: 'Влево', image: '/images/vorota-livorych.png', label: 'Відкатування вліво' },
  { value: 'Вправо', image: '/images/vorota-pravorych.png', label: 'Відкатування вправо' }
];

function SlidingDirectionChoice({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <fieldset className="wicket-opening-field">
      <legend>Направление отката<span className="required-mark"> *</span></legend>
      <div className="grid grid-cols-2 gap-4 mt-2 max-w-[500px]" role="radiogroup" aria-label="Направление отката">
        {slidingDirectionCards.map((option) => (
          <label className={`w-[242px] h-[148px] overflow-hidden relative flex items-center justify-center border rounded-lg p-2 cursor-pointer transition-all ${value === option.value ? 'border-dark bg-light-primary shadow-sm scale-[0.99]' : 'border-gray-200 hover:border-gray-300 active:scale-[0.99]'}`} key={option.value}>
            <input className="wicket-opening-input" type="radio" name="sliding-direction" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <img src={option.image} alt={option.label} className="w-full max-h-full object-contain" />
            <span className="wicket-opening-card-label hidden">{option.label}</span>
            {value === option.value && (
              <span className="wicket-opening-check absolute top-1.5 right-1.5 bg-dark rounded-full p-0.5" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}



type OrderState = {
  step: number;
  name: string;
  fenceType: string;
  color: string;
  noSections: boolean;
  sections: FenceRow[];
  noWicket: boolean;
  wicket: {
    width: string; height: string; quantity: string; openingOption: WicketOpening;
    hingeVariant: string; hingeCount: string; lock: string;
  };
  noSwing: boolean;
  swing: { width: string; height: string; opening: string; hingeVariant: string; hingeCount: string };
  noSliding: boolean;
  sliding: { width: string; height: string; direction: string };
};

const STORAGE_KEY = 'fence-order-state-v1';
const initialState: OrderState = {
  step: 1, name: '', fenceType: '', color: '7024', noSections: false,
  sections: [{ id: 'section-1', quantity: '1', width: '', height: '' }],
  noWicket: false, wicket: {
    width: '', height: '', quantity: '1', openingOption: 'На улицу, петли справа',
    hingeVariant: '', hingeCount: '', lock: '',
  },
  noSwing: false, swing: { width: '', height: '', opening: 'Внутрь', hingeVariant: '', hingeCount: '' },
  noSliding: false, sliding: { width: '', height: '', direction: 'Влево' },
};
const steps = ['Основное', 'Ворота и калитка', 'Проверка'];
const emptyGateErrors = { wicketHinge: false, swingHinge: false };

function restoreState(): OrderState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw) as Partial<OrderState>;
    const savedWicket = (saved.wicket ?? {}) as Partial<OrderState['wicket']> & {
      opening?: string;
      hinges?: string;
    };
    const { opening: legacyOpening, hinges: legacyHinges, ...savedWicketFields } = savedWicket;
    const savedOpeningOption = savedWicketFields.openingOption;
    const openingOption = wicketOpeningValues.includes(savedOpeningOption as WicketOpening)
      ? savedOpeningOption as WicketOpening
      : `${legacyOpening === 'Внутрь' ? 'Во двор' : 'На улицу'}, петли ${legacyHinges === 'Слева' ? 'слева' : 'справа'}` as WicketOpening;
    return {
      ...initialState, ...saved,
      step: Number.isInteger(saved.step) && saved.step! >= 1 && saved.step! <= 3 ? saved.step! : 1,
      fenceType: typeof saved.fenceType === 'string' ? saved.fenceType : initialState.fenceType,
      sections: Array.isArray(saved.sections) ? saved.sections.map((row, i) => ({
        id: typeof row.id === 'string' ? row.id : `section-${i + 1}`,
        quantity: String(row.quantity ?? '1'), width: String(row.width ?? ''), height: String(row.height ?? ''),
      })) : initialState.sections,
      wicket: { ...initialState.wicket, ...savedWicketFields, openingOption },
      swing: { ...initialState.swing, ...(saved.swing ?? {}) },
      sliding: { ...initialState.sliding, ...(saved.sliding ?? {}) },
    };
  } catch {
    return initialState;
  }
}

type FieldProps = {
  label: string; value: string; onChange: (value: string) => void; type?: string;
  suffix?: string; required?: boolean; error?: boolean; id: string; min?: string; step?: string; placeholder?: string;
};
function Field({ label, value, onChange, type = 'text', suffix, required, error, id, min, step, placeholder }: FieldProps) {
  return <label className={`field ${error ? 'field-error' : ''}`} htmlFor={id}>
    <span className="field-label">
      {label}{required && <span className="required-mark"> *</span>}
    </span>
    <span className="input-wrap">
      <input id={id} data-testid={`input-${id}`} type={type} value={value} min={min} step={step} placeholder={placeholder}
        required={required} aria-invalid={error || undefined} onChange={(event) => onChange(event.target.value)} />
      {suffix && <span className="input-suffix">{suffix}</span>}
    </span>
  </label>;
}

function Choice({ label, value, options, onChange, id, required, error }: {
  label: string; value: string; options: string[]; onChange: (value: string) => void; id: string;
  required?: boolean; error?: boolean;
}) {
  return <fieldset className={`choice-field ${error ? 'choice-field-error' : ''}`} aria-describedby={error ? `${id}-error` : undefined}>
    <legend>{label}{required && <span className="required-mark"> *</span>}</legend>
    <div className="choice-group" role="radiogroup" aria-label={label} aria-required={required || undefined} aria-invalid={error || undefined}>
      {options.map((option, index) => <button type="button" role="radio" aria-checked={value === option}
        className={`choice ${value === option ? 'selected' : ''}`} key={option} onClick={() => onChange(option)}
        data-testid={`choice-${id}-${index + 1}`}>{option}</button>)}
    </div>
    {error && <p className="choice-error" id={`${id}-error`} role="alert">Выберите один вариант.</p>}
  </fieldset>;
}

function WicketOpeningChoice({ value, onChange }: {
  value: WicketOpening;
  onChange: (value: WicketOpening) => void;
}) {
  return <fieldset className="wicket-opening-field">
    <legend>Вариант открытия калитки<span className="required-mark"> *</span></legend>
    <div className="wicket-opening-grid" role="radiogroup" aria-label="Вариант открытия калитки" aria-required="true">
      {wicketOpeningCards.map((option, index) => <label
        className={`wicket-opening-card w-[202px] h-[130px] ${value === option.value ? 'is-selected' : ''}`}
        key={option.value}
      >
        <input
          className="wicket-opening-input"
          type="radio"
          name="wicket-opening"
          value={option.value}
          aria-label={option.value}
          checked={value === option.value}
          required
          onChange={() => onChange(option.value)}
          data-testid={`choice-wicket-opening-${index + 1}`}
        />
        <img src={option.image} alt="" width={202} height={130} className="w-full object-contain" />
        <span className="wicket-opening-card-label hidden">{option.value}</span>
        {value === option.value && <span className="wicket-opening-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>}
      </label>)}
    </div>
  </fieldset>;
}


export function FenceOrder() {
  const [form, setForm] = useState<OrderState>(restoreState);
  const [nameError, setNameError] = useState(false);
  const [gateErrors, setGateErrors] = useState(emptyGateErrors);
  const [modalOpen, setModalOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState<'saving' | 'saved' | 'error'>('saving');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setStorageStatus('saved');
    } catch {
      setStorageStatus('error');
    }
  }, [form]);
  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setModalOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; };
  }, [modalOpen]);

  const update = <K extends keyof OrderState>(key: K, value: OrderState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const changeNested = (group: 'wicket' | 'swing' | 'sliding', key: string, value: string) => {
    setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
    if (group === 'wicket' && key === 'hingeVariant') setGateErrors((current) => ({ ...current, wicketHinge: false }));
    if (group === 'swing' && key === 'hingeVariant') setGateErrors((current) => ({ ...current, swingHinge: false }));
  };
  const setStep = (step: number) => {
    update('step', step);
    setNameError(false);
    setGateErrors(emptyGateErrors);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const validateGateChoices = () => {
    const errors = {
      wicketHinge: !form.noWicket && !form.wicket.hingeVariant,
      swingHinge: !form.noSwing && !form.swing.hingeVariant,
    };
    setGateErrors(errors);
    return !Object.values(errors).some(Boolean);
  };
  const next = () => {
    if (form.step === 1 && !form.name.trim()) { setNameError(true); document.getElementById('order-name')?.focus(); return; }
    if (form.step === 2 && !validateGateChoices()) return;
    setStep(Math.min(3, form.step + 1));
  };
  const submitOrder = () => {
    if (!form.name.trim()) {
      setNameError(true);
      update('step', 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!validateGateChoices()) {
      update('step', 2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setModalOpen(true);
  };
  const printOrder = () => window.print();
  const addSection = () => update('sections', [...form.sections, { id: `section-${Date.now()}-${form.sections.length}`, quantity: '1', width: '', height: '' }]);
  const patchSection = (id: string, key: keyof Omit<FenceRow, 'id'>, value: string) =>
    update('sections', form.sections.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const removeSection = (id: string) => update('sections', form.sections.filter((row) => row.id !== id));

  const summaryRow = (label: string, value: string) => <div className="summary-row" key={label}>
    <span>{label}</span><strong>{value || 'Не указано'}</strong>
  </div>;
  const allReviewFields: ReactNode = <>
    <div className="review-edit-grid">
      <Field id="review-name" label="Название заказа" value={form.name} required onChange={(v) => update('name', v)} />
      <Field id="review-fence-type" label="Тип забора" value={form.fenceType ?? ''} onChange={(v) => update('fenceType', v)} />
      <Field id="review-color" label="Цвет RAL" value={form.color} onChange={(v) => update('color', v)} />
    </div>
    <div className="review-edit-list">
      <h3>Секции забора</h3>
      {form.noSections ? <p className="absent">Отсутствует</p> : form.sections.map((row, i) => <div className="review-section-edit" key={row.id}>
        <span className="review-index">0{i + 1}</span>
        <Field id={`review-section-${row.id}-quantity`} label="Количество" type="number" min="1" value={row.quantity} onChange={(v) => patchSection(row.id, 'quantity', v)} />
        <Field id={`review-section-${row.id}-width`} label="Ширина (ширина проєму)" type="number" min="1" suffix="мм" value={row.width} onChange={(v) => patchSection(row.id, 'width', v)} />
        <Field id={`review-section-${row.id}-height`} label="Высота (высота габаритна)" type="number" min="1" suffix="мм" value={row.height} onChange={(v) => patchSection(row.id, 'height', v)} />
      </div>)}
      {!form.noSections && <button className="text-button" type="button" onClick={addSection}><Plus size={16} /> Добавить секцию</button>}
    </div>
    <div className="review-gates-grid">
      <ReviewGate title="Калитка" absent={form.noWicket} rows={[
        summaryRow('Ширина (ширина проєму)', form.wicket.width ? `${form.wicket.width} мм` : ''),
        summaryRow('Высота (высота габаритна)', form.wicket.height ? `${form.wicket.height} мм` : ''),
        summaryRow('Количество', form.wicket.quantity ? `${form.wicket.quantity} шт.` : ''),
        summaryRow('Вариант открытия калитки', form.wicket.openingOption),
        summaryRow('Вариант петель', form.wicket.hingeVariant), summaryRow('Количество петель на створку', form.wicket.hingeCount ? `${form.wicket.hingeCount} шт.` : ''),
        summaryRow('Замок', form.wicket.lock),
      ]} onEdit={() => setStep(2)} />
      <ReviewGate title="Распашные ворота" absent={form.noSwing} rows={[
        summaryRow('Ширина (ширина проєму)', form.swing.width ? `${form.swing.width} мм` : ''),
        summaryRow('Высота (высота габаритна)', form.swing.height ? `${form.swing.height} мм` : ''),
        summaryRow('Открывание', form.swing.opening), summaryRow('Вариант петель', form.swing.hingeVariant),
        summaryRow('Количество петель на створку', form.swing.hingeCount ? `${form.swing.hingeCount} шт.` : ''),
      ]} onEdit={() => setStep(2)} />
      <ReviewGate title="Откатные ворота (орієнтація ззовні)" absent={form.noSliding} rows={[
        summaryRow('Ширина (ширина проєму)', form.sliding.width ? `${form.sliding.width} мм` : ''),
        summaryRow('Высота (высота габаритна)', form.sliding.height ? `${form.sliding.height} мм` : ''),
        summaryRow('Направление отката', form.sliding.direction),
      ]} onEdit={() => setStep(2)} />
    </div>
  </>;

  return <main className={`app-shell ${modalOpen ? 'order-print-active' : ''}`}>
    <header className="topbar">
      <a className="brand" href="/" aria-label="Заказ ограждения — главная">
        <span className="brand-mark"><Fence size={21} strokeWidth={1.8} /></span>
        <span className="brand-name">Ограждение<span> / заказ</span></span>
      </a>
      <span className="topbar-note">Конфигуратор заказа</span>
    </header>

    <div className="page-wrap">
      <section className="intro">
        <div className="eyebrow">Индивидуальная комплектация</div>
        <h1>Соберите свой<br className="desktop-break" /> заказ ограждения</h1>
        <p>Укажите параметры секций и ворот — мы соберём всё в одном понятном списке.</p>
      </section>

      <nav className="progress" aria-label="Этапы заказа" style={{ marginBottom: '24px' }}>
        {steps.map((label, i) => <div className={`progress-step ${form.step === i + 1 ? 'current' : ''} ${form.step > i + 1 ? 'complete' : ''}`} key={label}>
          <span className="progress-number" style={{ fontSize: '16px', fontWeight: '600' }}>{form.step > i + 1 ? <Check size={16} /> : `0${i + 1}`}</span>
          <span className="progress-label" style={{ fontSize: '17px', fontWeight: '500', marginLeft: '8px' }}>{label}</span>
          {i < steps.length - 1 && <span className="progress-line" />}
        </div>)}
      </nav>

     <section className="wizard-card" key={form.step}>
        <div className="card-heading">
          <div>
            <h2>{form.step === 1 ? 'Основные параметры' : form.step === 2 ? 'Калитка и ворота' : 'Проверьте заказ'}</h2>
            <p>{form.step === 1 ? 'Начните с названия и параметров секций.' : form.step === 2 ? 'Добавьте нужные конструкции или отметьте, что они не нужны.' : 'Все данные можно изменить прямо здесь.'}</p>
          </div>
          <span className="step-icon"><ClipboardList size={22} strokeWidth={1.7} /></span>
        </div>


        {form.step === 1 && <div className="form-content">
          <section className="form-section">
            <div className="section-heading"><span className="section-number">01</span><div><h3>Общие сведения</h3><p>Укажите название заказа, тип забора и цвет RAL.</p></div></div>
            <div className="field-grid three-col">
              <Field id="order-name" label="Название заказа" value={form.name} required error={nameError} placeholder="Например, ограждение для дома" onChange={(v) => { update('name', v); if (v.trim()) setNameError(false); }} />
              <Field id="fence-type" label="Тип забора" value={form.fenceType ?? ''} onChange={(v) => update('fenceType', v)} placeholder="Например, евроштакетник" />
              <Field id="ral-color" label="Цвет RAL" value={form.color} onChange={(v) => update('color', v)} placeholder="Например, 7016 нажд" />
            </div>
            {nameError && <p className="validation-message" role="alert">Укажите название заказа, чтобы продолжить.</p>}
          </section>
          <section className="form-section section-list">
            <div className="section-heading"><span className="section-number">02</span><div><h3>Секции забора</h3><p>Задайте количество и размер каждой секции.</p></div></div>
            <label className="check-row">
              <input type="checkbox" checked={form.noSections} onChange={(e) => {
                const disabled = e.target.checked;
                update('noSections', disabled);
                update('sections', disabled
                  ? form.sections.map((row) => ({ ...row, quantity: '', width: '', height: '' }))
                  : form.sections.length ? form.sections : [{ id: `section-${Date.now()}`, quantity: '', width: '', height: '' }]);
              }} />
              <span className="custom-check"><Check size={16} strokeWidth={3.4} /></span><span>У меня нет секций</span>
            </label>
            {!form.noSections && <div className="section-rows">
              <div className="table-labels"><span>№</span><span>Количество</span><span>Ширина (ширина проєму)</span><span>Высота (высота габаритна)</span><span aria-hidden="true" /></div>
              {form.sections.map((row, index) => <div className="section-row" key={row.id} data-testid={`row-section-${index}`}>
                <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
                <Field id={`section-${row.id}-quantity`} label="Количество" type="number" min="1" value={row.quantity} onChange={(v) => patchSection(row.id, 'quantity', v)} />
                <Field id={`section-${row.id}-width`} label="Ширина (ширина проєму)" type="number" min="1" suffix="мм" placeholder="3000" value={row.width} onChange={(v) => patchSection(row.id, 'width', v)} />
                <Field id={`section-${row.id}-height`} label="Высота (высота габаритна)" type="number" min="1" suffix="мм" placeholder="1800" value={row.height} onChange={(v) => patchSection(row.id, 'height', v)} />
                <button type="button" className="icon-button remove-button" aria-label={`Удалить секцию ${index + 1}`} disabled={form.sections.length === 1} onClick={() => removeSection(row.id)} data-testid={`button-remove-section-${index}`}><Trash2 size={17} /></button>
              </div>)}
              <button type="button" className="add-button" onClick={addSection} data-testid="button-add-section"><span><Plus size={17} /></span> Добавить секцию</button>
            </div>}
          </section>
        </div>}

        {form.step === 2 && <div className="form-content gate-content">
          <GatePanel title="Калитка" caption="Проходная дверь в ограждении" absent={form.noWicket} onAbsent={(v) => {
            update('noWicket', v);
            setGateErrors((current) => ({ ...current, wicketHinge: false }));
          }} absentText="У меня нет калитки">
            <div className="field-grid three-col">
              <Field id="wicket-width" label="Ширина (ширина проєму)" type="number" min="1" suffix="мм" value={form.wicket.width} onChange={(v) => changeNested('wicket', 'width', v)} />
              <Field id="wicket-height" label="Высота (высота габаритна)" type="number" min="1" suffix="мм" value={form.wicket.height} onChange={(v) => changeNested('wicket', 'height', v)} />
              <Field id="wicket-quantity" label="Количество" type="number" min="1" suffix="шт." value={form.wicket.quantity} onChange={(v) => changeNested('wicket', 'quantity', v)} />
            </div>
            <WicketOpeningChoice
              value={form.wicket.openingOption}
              onChange={(value) => changeNested('wicket', 'openingOption', value)}
            />
            <div className="hinge-config">
              <Choice id="wicket-hinge-variant" label="Вариант петель" value={form.wicket.hingeVariant}
                options={['Петли болтовые', 'Петли скрытые', 'Петли алюминиевые']} required error={gateErrors.wicketHinge}
                onChange={(v) => changeNested('wicket', 'hingeVariant', v)} />
              <Field id="wicket-hinge-count" label="Количество петель на створку (шт)" type="number" min="1" step="1"
                value={form.wicket.hingeCount} onChange={(v) => changeNested('wicket', 'hingeCount', v)} />
            </div>
            <Choice id="wicket-lock" label="Замок" value={form.wicket.lock}
              options={['Электромеханический', 'Электромеханическая защёлка', 'Механический']}
              onChange={(v) => changeNested('wicket', 'lock', v)} />
          </GatePanel>
          <GatePanel title="Распашные ворота" caption="Две створки с открыванием внутрь или наружу" absent={form.noSwing} onAbsent={(v) => {
            update('noSwing', v);
            setGateErrors((current) => ({ ...current, swingHinge: false }));
          }} absentText="У меня нет распашных ворот">
            <div className="field-grid two-col">
              <Field id="swing-width" label="Ширина (ширина проєму)" type="number" min="1" suffix="мм" value={form.swing.width} onChange={(v) => changeNested('swing', 'width', v)} />
              <Field id="swing-height" label="Высота (высота габаритна)" type="number" min="1" suffix="мм" value={form.swing.height} onChange={(v) => changeNested('swing', 'height', v)} />
            </div>
            <SwingOpeningChoice value={form.swing.opening} onChange={(val) => changeNested('swing', 'opening', val)} />
            <div className="hinge-config">
              <Choice id="swing-hinge-variant" label="Вариант петель" value={form.swing.hingeVariant}
                options={['Петли болтовые', 'Петли скрытые', 'Петли алюминиевые']} required error={gateErrors.swingHinge}
                onChange={(v) => changeNested('swing', 'hingeVariant', v)} />
              <Field id="swing-hinge-count" label="Количество петель на створку (шт)" type="number" min="1" step="1"
                value={form.swing.hingeCount} onChange={(v) => changeNested('swing', 'hingeCount', v)} />
            </div>
          </GatePanel>
          <GatePanel title="Откатные ворота (орієнтація ззовні)" caption="Створка сдвигается вдоль линии ограждения" absent={form.noSliding} onAbsent={(v) => update('noSliding', v)} absentText="У меня нет откатных ворот">
            <div className="field-grid two-col">
              <Field id="sliding-width" label="Ширина (ширина проєму)" type="number" min="1" suffix="мм" value={form.sliding.width} onChange={(v) => changeNested('sliding', 'width', v)} />
              <Field id="sliding-height" label="Высота (высота габаритна)" type="number" min="1" suffix="мм" value={form.sliding.height} onChange={(v) => changeNested('sliding', 'height', v)} />
            </div>
            <SlidingDirectionChoice value={form.sliding.direction} onChange={(val) => changeNested('sliding', 'direction', val)} />
          </GatePanel>
        </div>}

        {form.step === 3 && <div className="form-content review-content">
          <div className="review-note"><span className="review-note-dot" /> Изменения сохраняются автоматически</div>
          {allReviewFields}
        </div>}

        <div className="card-footer">
          <button type="button" className="button button-quiet" onClick={() => form.step > 1 && setStep(form.step - 1)} disabled={form.step === 1} data-testid="button-back">
            <ChevronLeft size={17} /> Назад
          </button>
          <span className={`save-note ${storageStatus === 'error' ? 'save-note-error' : ''}`} role="status">
            <span className="save-dot" />
            {storageStatus === 'error' ? 'Не удалось сохранить черновик' : storageStatus === 'saving' ? 'Сохранение…' : 'Данные сохранены'}
          </span>
          {form.step < 3
            ? <button type="button" className="button button-dark" onClick={next} data-testid="button-next">Продолжить <ChevronRight size={17} /></button>
            : <button type="button" className="button button-dark" onClick={submitOrder} data-testid="button-submit">Оформить заказ <ChevronRight size={17} /></button>}
        </div>
      </section>
      <footer className="page-footer"><span>Конфигуратор ограждения</span><span>Состав заказа можно изменить в любой момент</span></footer>
    </div>

    {modalOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
      <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div><div className="modal-kicker">СВОДКА КОМПЛЕКТАЦИИ</div><h2 id="modal-title">Итоговый заказ</h2><p>Проверьте состав заказа перед завершением.</p></div>
          <button type="button" className="icon-button modal-close" aria-label="Закрыть окно" onClick={() => setModalOpen(false)} data-testid="button-close-modal"><X size={20} /></button>
        </header>
        <div className="modal-body">
          <ModalGroup title="Заказ">
            {summaryRow('Название', form.name)}
            {summaryRow('Тип забора', form.fenceType)}
            {summaryRow('Цвет RAL', form.color)}
          </ModalGroup>
          <ModalGroup title="Секции забора">
            {form.noSections ? <div className="summary-row"><span>Комплектация</span><strong className="absent">Отсутствует</strong></div> :
              form.sections.length ? form.sections.map((row, i) => <div className="section-summary" key={row.id}>
                {summaryRow(`Секция ${i + 1}`, `${row.quantity || '—'} шт.`)}
                {summaryRow('Ширина (ширина проєму)', row.width ? `${row.width} мм` : '—')}
                {summaryRow('Высота (высота габаритна)', row.height ? `${row.height} мм` : '—')}
              </div>) : <div className="summary-row"><span>Комплектация</span><strong>Не добавлены секции</strong></div>}
         </ModalGroup>
          <ModalGroup title="Калитка">
            {form.noWicket ? <Absent /> : <>
              {summaryRow('Ширина (ширина проєму)', form.wicket.width ? `${form.wicket.width} мм` : '')}
              {summaryRow('Высота (высота габаритна)', form.wicket.height ? `${form.wicket.height} мм` : '')}
              {summaryRow('Количество', form.wicket.quantity ? `${form.wicket.quantity} шт.` : '')}
              {summaryRow('Вариант открытия калитки', form.wicket.openingOption)}
              <div style={{ width: '193px', height: '124px', marginTop: '6px', marginBottom: '0px' }}>
                <img
                  src={wicketOpeningCards.find((option) => option.value === form.wicket.openingOption)?.image}
                  alt={`Схема открытия калитки: ${form.wicket.openingOption}`}
                  style={{ width: '193px', height: '124px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #E5E7EB', display: 'block' }}
                />
              </div>
              {summaryRow('Вариант петель', form.wicket.hingeVariant)}
              {summaryRow('Количество петель на створку', form.wicket.hingeCount ? `${form.wicket.hingeCount} шт.` : '')}
              {summaryRow('Замок', form.wicket.lock)}
            </>}
          </ModalGroup>
          <ModalGroup title="Распашные ворота">
            {form.noSwing ? <Absent /> : <>
              {summaryRow('Ширина (ширина проєму)', form.swing.width ? `${form.swing.width} мм` : '')}
              {summaryRow('Высота (высота габаритна)', form.swing.height ? `${form.swing.height} мм` : '')}
              {summaryRow('Открывание', form.swing.opening)}
              <div style={{ width: '385px', height: '100px', marginTop: '6px', marginBottom: '0px' }}>
              <img
                src={swingOpeningCards.find((option) => option.value === form.swing.opening)?.image}
                alt={`Схема открытия распашных ворот: ${form.swing.opening}`}
                className="!h-[100px] max-h-[100px] w-[385px] object-contain rounded-[6px] border border-[#E5E7EB] block"
                style={{ width: '385px', height: '100px', maxHeight: '100px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #E5E7EB', display: 'block' }}
              />
              </div>
              {summaryRow('Вариант петель', form.swing.hingeVariant)}
              {summaryRow('Количество петель на створку', form.swing.hingeCount ? `${form.swing.hingeCount} шт.` : '')}
            </>}
          </ModalGroup>
          <ModalGroup title="Откатные ворота (орієнтація ззовні)">
            {form.noSliding ? <Absent /> : <>
              {summaryRow('Ширина (ширина проєму)', form.sliding.width ? `${form.sliding.width} мм` : '')}
              {summaryRow('Высота (высота габаритна)', form.sliding.height ? `${form.sliding.height} мм` : '')}
              {summaryRow('Направление отката', form.sliding.direction)}
              <div style={{ width: '242px', height: '148px', marginTop: '6px', marginBottom: '0px' }}>
                <img
                  src={slidingDirectionCards.find((option) => option.value === form.sliding.direction)?.image}
                  alt={`Схема отката ворот: ${form.sliding.direction}`}
                  style={{ width: '242px', height: '148px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #E5E7EB', display: 'block' }}
                />
              </div>
            </>}
          </ModalGroup>

        </div>
        <div className="modal-footer">
          <div className="modal-footer-copy">
            <p>Это сводка вашей конфигурации — заказ не отправлен.</p>
          </div>
          <div className="modal-actions">
            <button type="button" className="button button-dark" onClick={printOrder} data-testid="button-save-pdf">
              <Printer size={17} /> Сохранить в PDF
            </button>
            <button type="button" className="button button-quiet" onClick={() => setModalOpen(false)} data-testid="button-modal-done">Понятно <Check size={17} /></button>
          </div>
        </div>
      </section>
    </div>}
  </main>;
}

function SwingOpeningChoice({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <fieldset className="wicket-opening-field">
      <legend>Вариант открытия ворот<span className="required-mark"> *</span></legend>
      <div className="flex flex-wrap gap-3 p-1.5" role="radiogroup" aria-label="Вариант открытия ворот">
        {swingOpeningCards.map((option) => (
          <label className={`w-[385px] h-[110px] overflow-hidden relative flex items-center justify-center border rounded-lg p-2 cursor-pointer transition-all ${value === option.value ? 'border-dark bg-light-primary shadow-sm scale-[0.99]' : 'border-gray-200 hover:border-gray-300 active:scale-[0.99]'}`} key={option.value}>
            <input className="wicket-opening-input" type="radio" name="swing-opening" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <img src={option.image} alt={option.label} className="w-full max-h-full object-contain" />
            <span className="wicket-opening-card-label hidden">{option.label}</span>
            {value === option.value && (
              <span className="wicket-opening-check absolute top-1.5 right-1.5 bg-dark rounded-full p-0.5" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function GatePanel({ title, caption, absent, onAbsent, absentText, children }: {
  title: string; caption: string; absent: boolean; onAbsent: (value: boolean) => void; absentText: string; children: ReactNode;
}) {
  return <section className={`gate-panel ${absent ? 'is-absent' : ''}`}>
    <div className="gate-panel-head">
      <div><span className="gate-dot" /><div><h3>{title}</h3><p>{caption}</p></div></div>
      <label className="check-row gate-check">
        <input type="checkbox" checked={absent} onChange={(e) => onAbsent(e.target.checked)} />
        <span className="custom-check">{absent && <Check size={16} strokeWidth={3.4} />}</span><span>{absentText}</span>
      </label>
    </div>
    {!absent && <div className="gate-panel-fields">{children}</div>}
    {absent && <p className="absent-message">Эта конструкция не входит в заказ</p>}
  </section>;
}

function ModalGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="modal-group"><h3>{title}</h3><div>{children}</div></section>;
}
function Absent() { return <div className="summary-row"><span>Комплектация</span><strong className="absent">Отсутствует</strong></div>; }
function ReviewGate({ title, absent, rows, onEdit }: { title: string; absent: boolean; rows: ReactNode[]; onEdit: () => void }) {
  return <section className="review-gate">
    <div className="review-gate-head"><h3>{title}</h3><button type="button" onClick={onEdit} className="text-button">Изменить</button></div>
    {absent ? <p className="absent">Отсутствует</p> : <div>{rows}</div>}
  </section>;
}

