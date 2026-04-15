package game

import "sync"

type RoundState struct {
	RoundID     int    `json:"roundId"`
	Phase       string `json:"phase"`
	SecondsLeft int    `json:"secondsLeft"`
}

type Engine struct {
	mu    sync.RWMutex
	state RoundState
}

func NewEngine() *Engine {
	return &Engine{
		state: RoundState{
			RoundID:     1,
			Phase:       "bet:open",
			SecondsLeft: 30,
		},
	}
}

func (e *Engine) State() RoundState {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.state
}

func (e *Engine) Advance() {
	e.mu.Lock()
	defer e.mu.Unlock()

	switch e.state.Phase {
	case "bet:open":
		e.state.Phase = "bet:closed"
		e.state.SecondsLeft = 5
	case "bet:closed":
		e.state.Phase = "race:running"
		e.state.SecondsLeft = 12
	case "race:running":
		e.state.Phase = "race:finished"
		e.state.SecondsLeft = 3
	default:
		e.state.RoundID++
		e.state.Phase = "bet:open"
		e.state.SecondsLeft = 30
	}
}
