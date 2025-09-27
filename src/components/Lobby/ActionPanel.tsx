type ActionCard = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  disabled?: boolean;
  hint?: string;
};

export const ActionPanel = ({
  heading,
  cards,
}: {
  heading: string;
  cards: ActionCard[];
}) => {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <h2 className="text-base font-semibold text-slate-900">{heading}</h2>
      <p className="mt-1 text-xs text-slate-500">
        Actions update automatically once your transaction confirms.
      </p>

      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <article
            key={card.id}
            className={`rounded-xl border border-slate-100 p-4 ${
              card.disabled ? 'opacity-60' : ''
            }`}
          >
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
              {card.hint ? (
                <span className="text-xs uppercase tracking-wide text-indigo-500">
                  {card.hint}
                </span>
              ) : null}
            </header>
            <p className="mt-2 text-xs text-slate-500">{card.description}</p>
            <button
              className={`mt-3 w-full rounded-lg py-2 text-sm font-semibold ${
                card.disabled
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-indigo-500 text-white'
              }`}
              disabled={card.disabled}
            >
              {card.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
