import { useEffect, useRef, useState, type FormEvent } from 'react'
import { calculate } from './api'
import { expression, operations, parseOperands, type Operation } from './calculator'

type Entry = { id: number; expression: string; result: number }
export default function App() {
 const [operation, setOperation] = useState<Operation>('add')
 const [first, setFirst] = useState('')
 const [second, setSecond] = useState('')
 const [history, setHistory] = useState<Entry[]>([])
 const [result, setResult] = useState<Entry | null>(null)
 const [error, setError] = useState('')
 const [loading, setLoading] = useState(false)
 const request = useRef<AbortController | null>(null)
 const sequence = useRef(0)
 const firstInput = useRef<HTMLInputElement>(null)
 useEffect(() => () => request.current?.abort(), [])
 const selected = operations.find(item => item.id === operation)!
 async function submit(event: FormEvent) {
  event.preventDefault()
  if (request.current) return
  setError('')
  setResult(null)
  let operands: number[]
  try { operands = parseOperands(operation, first, second) }
  catch (err) { setError((err as Error).message); return }
  const controller = new AbortController()
  request.current = controller
  setLoading(true)
  const timer = window.setTimeout(() => controller.abort(), 10000)
  try {
   const value = await calculate({ operation, operands }, controller.signal)
   const entry = { id: ++sequence.current, expression: expression(operation, operands), result: value }
   setResult(entry)
   setHistory(previous => [entry, ...previous].slice(0, 5))
  } catch (err) {
   setError(controller.signal.aborted ? 'The request timed out. Please try again.' :
    err instanceof TypeError ? 'Cannot reach the server. Check your connection and try again.' :
    (err as Error).message)
  } finally {
   window.clearTimeout(timer)
   request.current = null
   setLoading(false)
  }
 }
 function reset() {
  setFirst(''); setSecond(''); setError(''); setResult(null)
  firstInput.current?.focus()
 }
 return (
  <div className="app">
   <header className="topbar"><a className="brand" href="/" aria-label="Calc home"><span className="brand-icon">=</span>calc<span className="brand-dot">.</span></a><span className="top-note">A LITTLE CLARITY, ONE CALCULATION AT A TIME</span></header>
   <main>
    <section className="intro"><p className="eyebrow"><span /> SIMPLE BY DESIGN</p><h1>Make it<br /><em>add up.</em></h1><p className="intro-text">Big ideas. Small calculations.<br />A clear space to work things out.</p><div className="intro-rule" /><p className="intro-detail">Seven operations. Zero distractions.<br />Built for the numbers in your day.</p><div className="math-art" aria-hidden="true"><span>+</span><span>÷</span><span>×</span><span>=</span></div></section>
    <section className="workspace" aria-label="Calculator">
     <div className="calculator">
      <div className="card-heading"><h2>Your calculation</h2><span className="step">01 — INPUT</span></div>
      <form onSubmit={submit} noValidate>
       <fieldset disabled={loading}><legend>Choose an operation</legend><div className="operations">{operations.map(item => <button key={item.id} type="button" className={operation === item.id ? 'operation active' : 'operation'} aria-pressed={operation === item.id} onClick={() => { setOperation(item.id); setError(''); setResult(null) }}><span aria-hidden="true">{item.symbol}</span>{item.label}</button>)}</div>
       <p className="operation-help">{selected.description}</p>
       <div className={operation === 'sqrt' ? 'inputs unary' : 'inputs'}>
        <label htmlFor="first">{operation === 'percentage' ? 'Percentage' : 'First value'}<input ref={firstInput} id="first" name="first" type="text" inputMode="decimal" autoComplete="off" placeholder={operation === 'percentage' ? '15' : 'e.g. 24'} value={first} onChange={e => { setFirst(e.target.value); setResult(null); setError('') }} aria-describedby={error ? 'calculation-error' : 'number-help'} aria-invalid={!!error} /></label>
        {operation !== 'sqrt' && <><span className="input-symbol" aria-hidden="true">{selected.symbol}</span><label htmlFor="second">{operation === 'percentage' ? 'Of this number' : operation === 'power' ? 'Exponent' : 'Second value'}<input id="second" name="second" type="text" inputMode="decimal" autoComplete="off" placeholder={operation === 'percentage' ? '200' : 'e.g. 8'} value={second} onChange={e => { setSecond(e.target.value); setResult(null); setError('') }} aria-describedby={error ? 'calculation-error' : 'number-help'} aria-invalid={!!error} /></label></>}
       </div><p id="number-help" className="number-help">Decimals, negative numbers and scientific notation welcome.</p>
       <div className="actions"><button className="calculate" type="submit">{loading ? 'Calculating…' : 'Calculate'}<span aria-hidden="true">↗</span></button><button className="reset" type="button" onClick={reset}>Clear</button></div>
       </fieldset>
       {error && <p className="error" id="calculation-error" role="alert">{error}</p>}
      </form>
      <div className={'result-panel' + (result ? ' has-result' : '')} role="status" aria-live="polite" aria-atomic="true"><div className="result-label"><span>THE RESULT</span><span aria-hidden="true">=</span></div>{result ? <><p className="result-expression">{result.expression}</p><output className="result-value">{String(result.result)}</output></> : <><p className="empty-result">{loading ? 'Working it out…' : 'Room for an answer.'}</p><p className="result-hint">Your result will appear here.</p></>}</div>
     </div>
     <section className="history" aria-label="Recent calculations"><div className="history-heading"><h2>Recent calculations</h2>{history.length > 0 ? <button type="button" onClick={() => setHistory([])}>Clear history</button> : <span>THIS SESSION</span>}</div>{history.length === 0 ? <p className="history-empty">A fresh start. Your last five calculations will live here.</p> : <ol>{history.map(entry => <li key={entry.id}><span>{entry.expression}</span><strong>= {String(entry.result)}</strong></li>)}</ol>}</section>
    </section>
   </main>
   <footer><span>Made for a moment of clarity.</span><span>REACT + GO <span className="footer-dot">•</span> SEZZLE TAKE-HOME</span></footer>
  </div>
 )
}

