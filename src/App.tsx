import { useState, useEffect } from 'react'
import './App.css'

type Card = {
  suit: string
  rank: string
  image: string // image path
}

function getCardValue(card: Card): number {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10
  if (card.rank === 'A') return 11
  return parseInt(card.rank)
}

function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank
}

function isSoftHand(cards: Card[]): boolean {
  return cards.some(card => card.rank === 'A') &&
         cards.reduce((sum, card) => sum + getCardValue(card), 0) <= 21
}

function handTotal(cards: Card[]): number {
  let total = cards.reduce((sum, card) => sum + getCardValue(card), 0)
  let aces = cards.filter(c => c.rank === 'A').length
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

// Official 6-8 deck, S17, DAS charts (abbreviated to main chart for quiz app)
// Dealer upcard: 2-10, 11 (A)
const hardChart: { [playerTotal: number]: ('hit' | 'stick' | 'double')[] } = {
  17: ['stick','stick','stick','stick','stick','stick','stick','stick','stick','stick','stick'],
  16: ['stick','stick','stick','stick','stick','hit','hit','hit','hit','hit','hit'],
  15: ['stick','stick','stick','stick','stick','hit','hit','hit','hit','hit','hit'],
  14: ['stick','stick','stick','stick','stick','hit','hit','hit','hit','hit','hit'],
  13: ['stick','stick','stick','stick','stick','hit','hit','hit','hit','hit','hit'],
  12: ['hit','hit','stick','stick','stick','hit','hit','hit','hit','hit','hit'],
  11: ['double','double','double','double','double','double','double','double','double','double','hit'],
  10: ['double','double','double','double','double','double','double','double','hit','hit','hit'],
  9:  ['hit','double','double','double','double','hit','hit','hit','hit','hit','hit'],
  8:  ['hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit'],
  7:  ['hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit'],
  6:  ['hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit'],
  5:  ['hit','hit','hit','hit','hit','hit','hit','hit','hit','hit','hit'],
}

const softChart: { [playerTotal: number]: ('hit' | 'stick' | 'double')[] } = {
  20: ['stick','stick','stick','stick','stick','stick','stick','stick','stick','stick','stick'],
  19: ['stick','double','double','double','double','stick','stick','stick','stick','stick','stick'],
  18: ['double','double','double','double','double','stick','stick','hit','hit','hit','hit'],
  17: ['hit','double','double','double','double','hit','hit','hit','hit','hit','hit'],
  16: ['hit','hit','double','double','double','hit','hit','hit','hit','hit','hit'],
  15: ['hit','hit','double','double','double','hit','hit','hit','hit','hit','hit'],
  14: ['hit','hit','hit','double','double','hit','hit','hit','hit','hit','hit'],
  13: ['hit','hit','hit','double','double','hit','hit','hit','hit','hit','hit'],
}

const pairChart: { [pairRank: string]: ('split' | 'hit' | 'stick' | 'double')[] } = {
  'A': ['split','split','split','split','split','split','split','split','split','split','split'],
  'K': ['stick','stick','stick','stick','stick','stick','stick','stick','stick','stick','stick'],
  'Q': ['stick','stick','stick','stick','stick','stick','stick','stick','stick','stick','stick'],
  'J': ['stick','stick','stick','stick','stick','stick','stick','stick','stick','stick','stick'],
  '10': ['stick','stick','stick','stick','stick','stick','stick','stick','stick','stick','stick'],
  '9': ['split','split','split','split','split','stick','split','split','stick','stick','stick'],
  '8': ['split','split','split','split','split','split','split','split','split','split','split'],
  '7': ['split','split','split','split','split','split','hit','hit','hit','hit','hit'],
  '6': ['split','split','split','split','split','hit','hit','hit','hit','hit','hit'],
  '5': ['double','double','double','double','double','double','double','double','hit','hit','hit'],
  '4': ['hit','hit','hit','split','split','hit','hit','hit','hit','hit','hit'],
  '3': ['split','split','split','split','split','split','hit','hit','hit','hit','hit'],
  '2': ['split','split','split','split','split','split','hit','hit','hit','hit','hit'],
}

function getBestMove(player: Card[], dealer: Card): 'hit' | 'stick' | 'double' | 'split' {
  // Dealer upcard index: 2-10, Ace=11, index 0 is 2, index 9 is 10, index 10 is Ace
  const dealerVal = getCardValue(dealer)
  let dealerIdx = dealerVal === 11 ? 10 : dealerVal - 2
  if (dealerIdx < 0) dealerIdx = 0
  if (dealerIdx > 10) dealerIdx = 10
  const total = handTotal(player)
  const isSoft = isSoftHand(player)
  const isSplit = isPair(player)
  if (isSplit) {
    // Use pairChart
    let rank = player[0].rank
    // Treat face cards as 10s
    if (['K','Q','J'].includes(rank)) rank = '10'
    if (pairChart[rank]) {
      const move = pairChart[rank][dealerIdx]
      // If move is not split, fallback to hard/soft chart
      if (move === 'split') return 'split'
      // For 5s, treat as hard 10, for AA/88 always split
      if (move === 'double') return 'double'
      if (move === 'stick') return 'stick'
      if (move === 'hit') return 'hit'
    }
  }
  if (isSoft && total >= 13 && total <= 20) {
    // Use softChart
    const move = softChart[total]?.[dealerIdx]
    if (move === 'double') {
      // Only double if two cards, else hit
      if (player.length === 2) return 'double'
      else return 'hit'
    }
    return move ?? 'hit'
  }
  if (!isSoft && total >= 5 && total <= 17) {
    // Use hardChart
    const move = hardChart[total]?.[dealerIdx]
    if (move === 'double') {
      if (player.length === 2) return 'double'
      else return 'hit'
    }
    return move ?? (total >= 17 ? 'stick' : 'hit')
  }
  // For totals > 17, always stick
  if (total > 17) return 'stick'
  // Fallback
  return 'hit'
}

function getRandomCard(): Card {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades']
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const suit = suits[Math.floor(Math.random() * suits.length)]
  const rank = ranks[Math.floor(Math.random() * ranks.length)]
  const image = `cards/${rank}_of_${suit}.png`
  return { suit, rank, image }
}

function App() {
  const [dealerCards, setDealerCards] = useState<Card[]>([])
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [result, setResult] = useState<string | null>(null)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)

  useEffect(() => {
    dealNewHand()
  }, [])

  function dealNewHand() {
    let player = [getRandomCard(), getRandomCard()]
    while (handTotal(player) >= 21) {
      player = [getRandomCard(), getRandomCard()]
    }
    const dealer = [getRandomCard(), getRandomCard()]
    setPlayerCards(player)
    setDealerCards(dealer)
    setResult(null)
  }

  function handleChoice(choice: 'hit' | 'stick' | 'double' | 'split') {
    const correctMove = getBestMove(playerCards, dealerCards[0])
    const isCorrect = choice === correctMove
    if (isCorrect) setTotalCorrect(prev => prev + 1)
    setTotalAttempts(prev => prev + 1)
    setResult(isCorrect ? 'Correct!' : `Incorrect! The correct move was ${correctMove.toUpperCase()}.`)
  }

  function handleNext() {
    dealNewHand()
  }

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="table-area" style={{ flex: 1, background: '#004d00', color: 'white', padding: '20px' }}>
        <div className="dealer-hand">
          <h2 style={{ color: 'white' }}>Dealer</h2>
          <div>
            <img src={dealerCards[0]?.image} alt="Dealer card 1" style={{ width: 80 }} />
            <img src={`cards/back.png`} alt="Dealer card 2" style={{ width: 80 }} />
          </div>
        </div>
        <div className="player-hand" style={{ marginTop: 40 }}>
          <h2 style={{ color: 'white' }}>You</h2>
          <div>
            {playerCards.map((card, i) => (
              <img key={i} src={card.image} alt={`Player card ${i + 1}`} style={{ width: 80 }} />
            ))}
          </div>
        </div>
        {result && (
          <div style={{ marginTop: 30, fontSize: 20 }}>
            <p>{result}</p>
            <button onClick={handleNext}>Next Hand</button>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          Score: {totalCorrect} / {totalAttempts}
        </div>
      </div>
      <div className="controls" style={{ width: 200, background: '#f2f2f2', color: '#000', padding: '20px' }}>
        <h3>Choose your move</h3>
        {['hit', 'stick', 'double', 'split'].map((action) => (
          <button
            key={action}
            onClick={() => handleChoice(action as any)}
            disabled={!!result}
            style={{
              width: '100%',
              padding: '10px',
              margin: '10px 0',
              fontSize: '16px',
              background: '#004d99',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {action.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App
