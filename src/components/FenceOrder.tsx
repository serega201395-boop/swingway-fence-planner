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
const POST_SECTIONS = [
  '40х80х2', '60х60х2', '60х100х3', '80х80х2', '80х80х3', '100х100х3', '120х120х3', '150х150х4'
];

type OrderState = {
  step: number; name: string; fenceType: string; color: string; noSections: boolean; sections: FenceRow[];
  noWicket: boolean; wicket: {
    width: string; height: string; quantity: string; openingOption: WicketOpening;
    hingeVariant: string; hingeCount: string; lock: string;
    postInstallation: 'бетонирование' | 'на_платформе' | 'к_колоннам' | '';
    postLength: string; platformSize: string; postSection: string; comment: string;
  };
  noSwing: boolean; swing: { 
    width: string; height: string; opening: string; hingeVariant: string; hingeCount: string;
    postInstallation: 'бетонирование' | 'на_платформе' | 'к_колоннам' | '';
    postLength: string; platformSize: string; postSection: string; comment: string;
  };
  noSliding: boolean; sliding: { 
    width: string; height: string; direction: string;
    postInstallation: 'бетонирование' | 'на_платформе' | 'к_колоннам' | '';
    supportPostLength: string; supportPostSection: string;
    catchPostLength: string; catchPostSection: string; platformSize: string; comment: string;
  };
};

const STORAGE_KEY = 'fence-order-state-v1';
const initialState: OrderState = {
  step: 1, name: '', fenceType: '', color: '7024', noSections: false,
  sections: [{ id: 'section-1', quantity: '1', width: '', height: '' }],
  noWicket: false, wicket: {
    width: '', height: '', quantity: '1', openingOption: 'На улицу, петли справа',
    hingeVariant: '', hingeCount: '', lock: '',
    postInstallation: '', postLength: '', platformSize: '200х200х8', postSection: '40х80х2', comment: ''
  },
  noSwing: false, swing: { 
    width: '', height: '', opening: 'Внутрь', hingeVariant: '', hingeCount: '',
    postInstallation: '', postLength: '', platformSize: '200х200х8', postSection: '80х80х3', comment: ''
  },
  noSliding: false, sliding: { 
    width: '', height: '', direction: 'Влево',
    postInstallation: '', supportPostLength: '', supportPostSection: '80х80х3',
    catchPostLength: '', catchPostSection: '60х60х2', platformSize: '200х200х8', comment: ''
  },
};

const steps = ['Основное', 'Ворота и калитка', 'Проверка'];
const emptyGateErrors = { 
  wicketHinge: false, swingHinge: false, wicketPostInstallation: false, swingPostInstallation: false, slidingPostInstallation: false 
};

function restoreState(): OrderState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw) as Partial<OrderState>;
    return { ...initialState, ...saved } as OrderState;
  } catch { return initialState; }
}

type FieldProps = {
  label: string; value: string; onChange: (value: string) => void; type?: string;
  suffix?: string; required?: boolean; error?: boolean; id: string; min?: string; step?: string; placeholder?: string;
  disabled?: boolean;
};
function Field({ label, value, onChange, type = 'text', suffix, required, error, id, min, step, placeholder, disabled }: FieldProps) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`} htmlFor={id}>
      <span className="field-label">{label}{required && <span className="required-mark"> *</span>}</span>
      <span className="input-wrap">
        <input id={id} data-testid={`input-${id}`} type={type} value={value} min={min} step={step} placeholder={placeholder}
          required={required} disabled={disabled} aria-invalid={error || undefined} onChange={(e) => onChange(e.target.value)} />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </span>
    </label>
  );
}

function Choice({ id, label, value, options, required, error, onChange }: any) {
  return (
    <div className="flex flex-col gap-1.5 my-2">
      <span className="block text-[#1f2937] text-[14.5px] font-normal">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="flex flex-wrap gap-4" role="radiogroup" aria-label={label}>
        {options.map((option: string) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`px-4 py-2 text-[14px] font-medium rounded-lg border transition-all ${value === option ? 'bg-[#30373d] text-white border-[#30373d]' : 'bg-white text-gray-700 border-gray-200'}`}>{option}</button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5" role="alert">Выберите один вариант.</p>}
    </div>
  );
}

function SectionSelectWithCustom({ label, value, onChange, options, id }: any) {
  const [isCustom, setIsCustom] = useState(!options.includes(value) && value !== '');
  return (
    <div className="field">
      <span className="field-label">{label}<span className="required-mark"> *</span></span>
      {!isCustom ? (
        <select id={id} className="w-full h-10 px-3 border border-[#dfe3e6] rounded-[7px] bg-white text-[14px]" value={value} onChange={(e) => e.target.value === 'custom' ? setIsCustom(true) : onChange(e.target.value)}>
          <option value="" disabled>Выберите сечение</option>
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          <option value="custom">Другой размер...</option>
        </select>
      ) : (
        <div className="input-wrap">
          <input id={id} type="text" value={value} placeholder="Например, 100х50х3" onChange={(e) => onChange(e.target.value)} className="w-full h-10 px-3 border border-[#dfe3e6] rounded-[7px]" />
          <button type="button" onClick={() => { setIsCustom(false); onChange(options[0]); }} className="absolute right-2 px-2 py-1 text-xs bg-gray-100 rounded">Из списка</button>
        </div>
      )}
    </div>
  );
}

function GatePanel({ title, caption, absent, onAbsent, absentText, children }: any) {
  return (
    <section className={`gate-panel ${absent ? 'is-absent' : ''}`}>
      <div className="gate-panel-head">
        <div><span className="gate-dot" /><div><h3>{title}</h3><p>{caption}</p></div></div>
        <label className="check-row gate-check">
          <input type="checkbox" checked={absent} onChange={(e) => onAbsent(e.target.checked)} />
          <span className="custom-check"><Check size={16} strokeWidth={3.4} /></span><span>{absentText}</span>
        </label>
      </div>
      {!absent && <div className="gate-panel-fields">{children}</div>}
      {absent && <p className="absent-message">Эта конструкция не входит в заказ</p>}
    </section>
  );
}

export function FenceOrder() {
  const [form, setForm] = useState<OrderState>(restoreState);
  const [nameError, setNameError] = useState(false);
  const [gateErrors, setGateErrors] = useState(emptyGateErrors);
  const [modalOpen, setModalOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState<'saving' | 'saved' | 'error'>('saved');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const update = <K extends keyof OrderState>(key: K, value: OrderState[K]) => setForm((c) => ({ ...c, [key]: value }));

  const changeNested = (group: 'wicket' | 'swing' | 'sliding', key: string, value: any) => {
    setForm((current) => {
      const updatedGroup = { ...current[group], [key]: value };
      if (group === 'wicket') {
        if (key === 'postInstallation') updatedGroup.postLength = value === 'бетонирование' && current.wicket.height ? String(Number(current.wicket.height) + 1000) : '';
        else if (key === 'height' && current.wicket.postInstallation === 'бетонирование') updatedGroup.postLength = value ? String(Number(value) + 1000) : '';
      }
      if (group === 'swing') {
        if (key === 'postInstallation') updatedGroup.postLength = value === 'бетонирование' && current.swing.height ? String(Number(current.swing.height) + 1000) : '';
        else if (key === 'height' && current.swing.postInstallation === 'бетонирование') updatedGroup.postLength = value ? String(Number(value) + 1000) : '';
      }
      if (group === 'sliding') {
        if (key === 'postInstallation') {
          const isBeton = value === 'бетонирование'; const h = current.sliding.height;
          updatedGroup.supportPostLength = isBeton && h ? String(Number(h) + 1000) : '';
          updatedGroup.catchPostLength = isBeton && h ? String(Number(h) + 1000) : '';
        } else if (key === 'height' && current.sliding.postInstallation === 'бетонирование') {
          updatedGroup.supportPostLength = value ? String(Number(value) + 1000) : '';
          updatedGroup.catchPostLength = value ? String(Number(value) + 1000) : '';
        }
      }
      return { ...current, [group]: updatedGroup };
    });
    if (group === 'wicket' && key === 'hingeVariant') setGateErrors((c) => ({ ...c, wicketHinge: false }));
    if (group === 'wicket' && key === 'postInstallation') setGateErrors((c) => ({ ...c, wicketPostInstallation: false }));
  };

  const validateGateChoices = () => {
    const errors = {
      wicketHinge: !form.noWicket && !form.wicket.hingeVariant,
      wicketPostInstallation: !form.noWicket && !form.wicket.postInstallation,
      swingHinge: !form.noSwing && !form.swing.hingeVariant,
      swingPostInstallation: !form.noSwing && !form.swing.postInstallation,
      slidingPostInstallation: !form.noSliding && !form.sliding.postInstallation,
    };
    setGateErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const next = () => {
    if (form.step === 1 && !form.name.trim()) { setNameError(true); return; }
    if (form.step === 2 && !validateGateChoices()) return;
    update('step', Math.min(3, form.step + 1));
  };

  const addSection = () => update('sections', [...form.sections, { id: `sec-${Date.now()}`, quantity: '1', width: '', height: '' }]);
  const patchSection = (id: string, key: keyof Omit<FenceRow, 'id'>, value: string) => update('sections', form.sections.map((row) => row.id === id ? { ...row, [key]: value } : row));
  const removeSection = (id: string) => update('sections', form.sections.filter((row) => row.id !== id));

  const summaryRow = (label: string, value: string) => <div className="summary-row" key={label}><span>{label}</span><strong>{value || 'Не указано'}</strong></div>;

  return (
    <main className={`app-shell ${modalOpen ? 'order-print-active' : ''}`}>
      <header className="topbar">
        <span className="brand-name">Ограждение / заказ</span>
      </header>

      <div className="page-wrap">
        <nav className="progress" aria-label="Этапы заказа" style={{ marginBottom: '24px' }}>
          {steps.map((label, i) => (
            <div className={`progress-step ${form.step === i + 1 ? 'current' : ''}`} key={label}>
              <span>0{i + 1} - {label}</span>
            </div>
          ))}
        </nav>

        <section className="wizard-card">
          {form.step === 1 && (
            <div className="form-content">
              <Field id="order-name" label="Название заказа" value={form.name} required error={nameError} onChange={(v) => { update('name', v); if(v.trim()) setNameError(false); }} />
              <Field id="fence-type" label="Тип забора" value={form.fenceType} onChange={(v) => update('fenceType', v)} />
              <Field id="ral-color" label="Цвет RAL" value={form.color} onChange={(v) => update('color', v)} />
              
              <div className="section-rows mt-4">
                {form.sections.map((row, index) => (
                  <div className="section-row flex gap-2 items-end mb-2" key={row.id}>
                    <Field id={`sec-q-${row.id}`} label="Количество" value={row.quantity} onChange={(v) => patchSection(row.id, 'quantity', v)} />
                    <Field id={`sec-w-${row.id}`} label="Ширина" value={row.width} onChange={(v) => patchSection(row.id, 'width', v)} />
                    <Field id={`sec-h-${row.id}`} label="Высота" value={row.height} onChange={(v) => patchSection(row.id, 'height', v)} />
                    <button type="button" className="p-2 bg-red-100 text-red-600 rounded" onClick={() => removeSection(row.id)} disabled={form.sections.length === 1}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button type="button" className="add-button p-2 bg-gray-100 rounded mt-2" onClick={addSection}>+ Добавить секцию</button>
              </div>
            </div>
          )}

          {form.step === 2 && (
            <div className="form-content gate-content">
              <GatePanel title="Калитка" absent={form.noWicket} onAbsent={(v: boolean) => update('noWicket', v)} absentText="У меня нет калитки">
                <div className="field-grid three-col">
                  <Field id="wicket-width" label="Ширина" value={form.wicket.width} onChange={(v) => changeNested('wicket', 'width', v)} />
                  <Field id="wicket-height" label="Высота" value={form.wicket.height} onChange={(v) => changeNested('wicket', 'height', v)} />
                </div>
                <Choice id="wicket-hinge-variant" label="Вариант петель" value={form.wicket.hingeVariant} options={['Петли болтовые', 'Петли скрытые']} error={gateErrors.wicketHinge} onChange={(v: string) => changeNested('wicket', 'hingeVariant', v)} />
              </GatePanel>
            </div>
          )}

          {form.step === 3 && (
            <div className="form-content review-content">
              <h3>Проверка спецификации</h3>
              {summaryRow('Название', form.name)}
              {summaryRow('Тип забора', form.fenceType)}
            </div>
          )}

          <div className="card-footer flex justify-between mt-4 border-t pt-4">
            <button type="button" className="button button-quiet" onClick={() => update('step', form.step - 1)} disabled={form.step === 1}>Назад</button>
            <button type="button" className="button button-dark" onClick={form.step < 3 ? next : () => setModalOpen(true)}>{form.step < 3 ? 'Продолжить' : 'Оформить заказ'}</button>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2>Итоговый заказ оформлен!</h2>
            <button type="button" className="mt-4 p-2 bg-gray-900 text-white rounded w-full" onClick={() => setModalOpen(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </main>
  );
}