export default function NumeroGrid({ numeros, onClickNumero, soloVer = false }) {
  const cols = Math.min(10, Math.ceil(Math.sqrt(numeros.length)));

  return (
    <div className="num-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {numeros.map(n => (
        <div
          key={n.numero}
          className={`num-cell${n.apartado ? ' taken' : ''}${n.ganador ? ' winner' : ''}`}
          onClick={() => !soloVer && onClickNumero(n)}
          title={n.apartado ? `${n.nombre}` : `Número ${n.numero}`}
          style={{ minWidth: 32, minHeight: 32 }}
        >
          {n.numero}
          {n.ganador && (
            <span style={{ position: 'absolute', top: -6, right: -4, fontSize: 12 }}></span>
          )}
        </div>
      ))}
    </div>
  );
}