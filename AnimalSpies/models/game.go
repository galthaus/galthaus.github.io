package models

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

type GameType int

const (
	// since iota starts with 0, the first value
	// defined here will be the default
	UndefinedGT GameType = iota
	BasicGame
	MoleGame
	WalrusGame
	MoleWalrusGame
)

func (gt GameType) String() string {
	switch gt {
	case BasicGame:
		return "Basic"
	case MoleGame:
		return "Mole"
	case WalrusGame:
		return "Walrus"
	case MoleWalrusGame:
		return "MoleWalrus"
	}
	return fmt.Sprintf("undefined GameType: %d", gt)
}

type GameState int

const (
	UndefinedGS GameState = iota
	GameJoining
	GamePlaying
	GameFinished
)

func (gs GameState) String() string {
	switch gs {
	case GameJoining:
		return "Waiting for Another Player"
	case GamePlaying:
		return "In progress"
	case GameFinished:
		return "Complete"
	}
	return fmt.Sprintf("undefined GameState: %d", gs)
}

type GameListEntry struct {
	Seed    string
	State   GameState
	Players []string
	Info    *PlayerInfo `json:",omitempty"`
	Scores  []int       `json:",omitempty"`
	Winner  string      `json:",omitempty"`
}

func (gle *GameListEntry) SplitOptions() []*SplitInfo {
	cards := gle.Info.Hand
	numCards := len(cards)
	doMoleCard := numCards > 5

	answer := []*SplitInfo{}
	seenChooseCard := map[IntelCard]struct{}{}
	for chooseCard := 0; chooseCard < numCards; chooseCard++ {
		if _, ok := seenChooseCard[cards[chooseCard]]; ok {
			continue
		}
		seenChooseCard[cards[chooseCard]] = struct{}{}
		seenMoleCard := map[IntelCard]struct{}{}
		for moleCard := 0; moleCard < numCards; moleCard++ {
			if !doMoleCard {
				moleCard = numCards
			} else {
				if _, ok := seenMoleCard[cards[moleCard]]; ok {
					continue
				}
				seenMoleCard[cards[moleCard]] = struct{}{}
			}
			remaining := make(IntelCards, 4)
			for jj, ii := 0, 0; ii < numCards; ii++ {
				if ii == chooseCard || ii == moleCard {
					continue
				}
				remaining[jj] = cards[ii]
				jj++
			}

			piles := permute(remaining)
			for _, pile := range piles {
				si := &SplitInfo{
					Pile1:      pile[0],
					Pile2:      pile[1],
					ChooseCard: cards[chooseCard],
				}

				if doMoleCard {
					si2 := &SplitInfo{
						Pile1:      pile[0],
						Pile2:      pile[1],
						ChooseCard: cards[chooseCard],
					}
					si.Hidden2 = cards[moleCard]
					si2.Hidden1 = cards[moleCard]
					answer = append(answer, si2)
				}
				answer = append(answer, si)
			}
		}
	}
	return answer
}

// Permute four cards into to sets with a minimum of 1 per set.
func permute(cards IntelCards) [][]IntelCards {
	answer := [][]IntelCards{}

	for i := 1; i < 2^len(cards)-1; i++ {
		opt := []IntelCards{{}, {}}
		for j := 0; j < len(cards); j++ {
			if i&(1<<j) == 0 {
				opt[0] = append(opt[0], cards[j])
			} else {
				opt[1] = append(opt[1], cards[j])
			}
		}
		opt[0].Sort()
		opt[1].Sort()
		if optContains(answer, opt) {
			continue
		}
		answer = append(answer, opt)
	}
	return answer
}

func optContains(answer [][]IntelCards, opt []IntelCards) bool {
	for _, test := range answer {
		if test[0].Compare(opt[0]) == 0 && test[1].Compare(opt[1]) == 0 {
			return true
		}
		if test[0].Compare(opt[1]) == 0 && test[1].Compare(opt[0]) == 0 {
			return true
		}
	}
	return false
}

func (gle *GameListEntry) Print() {
	fmt.Printf("Seed : %s\n", gle.Seed)
	fmt.Printf("State: %s\n", gle.State.String())
	fmt.Printf("Player 1: %s\n", gle.Players[0])
	if len(gle.Players) == 1 {
		fmt.Printf("Player 2: %s\n", "Unset")
	} else {
		fmt.Printf("Player 2: %s\n", gle.Players[1])
	}
	if gle.Info != nil {
		gle.Info.Print()
	}

	if gle.State == GameFinished {
		fmt.Printf("Player 1 scored: %d\n", gle.Scores[0])
		fmt.Printf("Player 2 scored: %d\n", gle.Scores[1])
		fmt.Printf("WINNER: %s\n", gle.Winner)
	}
}

type Game struct {
	Seed     string
	GameType GameType
	State    GameState

	PlayerIds    []string
	PlayerTokens []string

	IntelDeck IntelCards
	AgentDeck AgentCards

	DoubleAgent Agent

	Players    []*PlayerInfo
	HiddenCard IntelCard

	lock sync.Mutex
	seed int64
}

// NewGame makes a new game
func NewGame(gt GameType, player, token string) (g *Game, err error) {
	g = &Game{
		seed:      time.Now().UnixNano(),
		GameType:  gt,
		AgentDeck: AgentDeck(),
		Players:   []*PlayerInfo{{}, {}},
	}
	g.Seed = fmt.Sprintf("%d", g.seed)
	rand.Seed(g.seed)
	switch gt {
	case BasicGame:
		g.IntelDeck = BasicDeck(false)
	case MoleGame:
		g.IntelDeck = MoleDeck(false)
	case WalrusGame:
		g.IntelDeck = BasicDeck(true)
	case MoleWalrusGame:
		g.IntelDeck = MoleDeck(true)
	default:
		return nil, fmt.Errorf(gt.String())
	}

	g.IntelDeck.Shuffle()
	g.AgentDeck.Shuffle()

	da := g.AgentDeckDraw()
	g.DoubleAgent = da
	if g.GameType != WalrusGame {
		g.Players[0].DoubleAgent = da
		g.Players[1].DoubleAgent = da
	}

	g.Players[0].Identity = g.AgentDeckDraw()
	g.Players[1].Identity = g.AgentDeckDraw()
	g.Players[0].Spy = g.AgentDeckDraw()
	g.Players[1].Spy = g.AgentDeckDraw()

	g.PlayerIds = append(g.PlayerIds, player)
	g.PlayerTokens = append(g.PlayerTokens, token)
	g.State = GameJoining

	g.StartHand(0)
	return g, nil
}

// StartHand starts a new hand
// This must be called with the lock unless the game is created.
func (g *Game) StartHand(player int) {
	p1 := player
	p2 := (player + 1) % 2
	g.Players[p1].Split = nil
	g.Players[p2].Hand = nil
	g.Players[p2].Split = nil
	g.Players[p1].HiddenCardPile = 2
	g.Players[p2].HiddenCardPile = 2
	g.HiddenCard.Agent = Undefined
	g.HiddenCard.Count = 0

	if len(g.IntelDeck) == 0 {
		// Switch to bet
		g.Players[0].State = Betting
		g.Players[0].Hand = nil
		g.Players[1].State = Betting
		g.Players[1].Hand = nil
		return
	}

	g.Players[p1].State = Spliting
	g.Players[p1].Hand = g.IntelDeckDrawHand()
	g.Players[p2].State = WaitingForSplit
}

// PlayerSplit - handles the answer from a player spliting the hand into piles
// A 3 or 5 deep array
// 0 - pile 0
// 1 - pile 1
// 2 - choosing card
// 3 - Pile 0 hidden card (Mole game)
// 4 - Pile 1 hidden card (Mole game)
func (g *Game) PlayerSplit(player, token string, splitData *SplitInfo) error {
	g.lock.Lock()
	defer g.lock.Unlock()

	p1, p2, err := g.GetPlayers(player, token)
	if err != nil {
		return err
	}
	if g.State != GamePlaying {
		return fmt.Errorf("not the right game state: %s", g.State.String())
	}
	if g.Players[p1].State != Spliting {
		return fmt.Errorf("not the right state for splitting with this player")
	}

	if len(splitData.Pile1) == 0 {
		return fmt.Errorf("Pile 1 must have at least one card")
	}
	if len(splitData.Pile2) == 0 {
		return fmt.Errorf("Pile 2 must have at least one card")
	}
	if splitData.ChooseCard.Agent == Undefined {
		return fmt.Errorf("Choose Card must be valid")
	}

	// GREG: 0 should be unset, 1= pile1 2= pile2 - fix it
	hc := 2
	if splitData.Hidden1.Agent != Undefined {
		hc = 0
		g.HiddenCard = splitData.Hidden1
	}
	if splitData.Hidden2.Agent != Undefined {
		hc = 1
		g.HiddenCard = splitData.Hidden2
	}

	if (g.GameType == MoleGame || g.GameType == MoleWalrusGame) && (hc == 2 || g.HiddenCard.Agent == Undefined) {
		return fmt.Errorf("Hidden Card must be valid and a pile choosen")
	}

	// GREG: Validate that pile1+pile2+chooseCard+hiddenCard = hand

	g.Players[p1].State = WaitingForSelect
	g.Players[p1].Hand = nil
	g.Players[p1].Split = nil
	g.Players[p2].HiddenCardPile = 2

	g.Players[p2].State = Selecting
	g.Players[p2].Hand = nil
	g.Players[p2].Split = splitData
	g.Players[p2].HiddenCardPile = hc
	return nil
}

// PlayerSelected handles the select piles and card pile options
func (g *Game) PlayerSelected(player, token string, selectData *SelectInfo) error {
	g.lock.Lock()
	defer g.lock.Unlock()

	choosePile := selectData.ChoosePile
	cardPile := selectData.CardPile

	p1, p2, err := g.GetPlayers(player, token)
	if err != nil {
		return err
	}

	if g.State != GamePlaying {
		return fmt.Errorf("not the right game state: %s", g.State.String())
	}
	if g.Players[p1].State != Selecting {
		return fmt.Errorf("not the right state for selecting with this player")
	}

	splits := g.Players[p1].Split
	piles := []IntelCards{splits.Pile1, splits.Pile2}
	otherPile := (choosePile + 1) % 2

	// Put choice card on the appropriate pile
	piles[cardPile] = append(piles[cardPile], splits.ChooseCard)

	// Mole games will have the HCP set
	hc := g.Players[p1].HiddenCardPile
	if hc != 2 {
		piles[hc] = append(piles[hc], g.HiddenCard)
	}

	// Hand out the cards
	g.Players[p1].Intel = append(g.Players[p1].Intel, piles[choosePile]...)
	g.Players[p2].Intel = append(g.Players[p2].Intel, piles[otherPile]...)

	// Check walrus count
	for p1 := 0; p1 < 2; p1++ {
		wc := 0
		for _, c := range g.Players[p1].Intel {
			if c.Walrus {
				wc++
			}
		}
		if wc >= 3 {
			g.Players[p1].DoubleAgent = g.DoubleAgent
		}
	}

	// Start new hand
	g.StartHand(p1)
	return nil
}

// PlayerBet handles the betting results of a player
func (g *Game) PlayerBet(player, token string, betData *BetInfo) error {
	g.lock.Lock()
	defer g.lock.Unlock()

	p1, p2, err := g.GetPlayers(player, token)
	if err != nil {
		return err
	}

	if g.State != GamePlaying {
		return fmt.Errorf("not the right game state: %s", g.State.String())
	}
	if g.Players[p1].State != Betting {
		return fmt.Errorf("not the right state for betting with this player")
	}

	g.Players[p1].State = WaitingForBetting
	g.Players[p1].BetAgent = betData.Identity
	g.Players[p1].BetAmount = betData.Bet

	if g.Players[p2].State == WaitingForBetting {
		g.EndGame()
	}
	return err
}

// EndGame marks the game over and calculates the score
func (g *Game) EndGame() {
	g.lock.Lock()
	defer g.lock.Unlock()

	g.State = GameFinished
	g.Players[0].State = Finished
	g.Players[1].State = Finished

	for p1 := 0; p1 < 2; p1++ {
		p2 := (p1 + 1) % 2

		for _, c := range g.Players[p1].Intel {
			if c.Agent == g.Players[p1].Identity {
				g.Players[p1].Score += c.Count
			}
			if c.Agent == g.Players[p2].Spy {
				g.Players[p2].Score += c.Count
			}
			if c.Agent == g.DoubleAgent {
				g.Players[p1].Score += c.Count
			}
		}
		if g.Players[p1].BetAgent == g.Players[p2].Identity {
			g.Players[p1].Score += g.Players[p1].BetAmount
		} else {
			g.Players[p1].Score -= g.Players[p1].BetAmount
		}
	}
}

// Print dumps the game state - does not take a lock.
// Should only be used for debug
func (g *Game) Print() {
	fmt.Printf("Game: %s\n", g.Seed)
	fmt.Printf("  GameType: %s\n", g.GameType.String())
	fmt.Printf("  GameState: %s\n", g.State.String())
	fmt.Printf("  DoubleAgent: %s\n", g.DoubleAgent.String())
	fmt.Printf("  AgentDeck: %s\n", g.AgentDeck.String())
	fmt.Printf("  IntelDeck: %s\n", g.IntelDeck.String())
	fmt.Printf("  HiddenCard: %s\n", g.HiddenCard.String())
	fmt.Printf("  Player 1 - %s:%s:\n", g.GetPlayer(0), g.GetToken(g.GetPlayer(0)))
	g.Players[0].Print()
	fmt.Printf("  Player 2 - %s:%s:\n", g.GetPlayer(1), g.GetToken(g.GetPlayer(1)))
	g.Players[1].Print()
}

// AgentDeckDraw gets the top card from the Agent Deck
// Must have a lock
func (g *Game) AgentDeckDraw() Agent {
	d, n := g.AgentDeck.Draw(1)
	g.AgentDeck = n
	return d[0]
}

// IntelDeckDrawHand gets the next 5 or 6 cards from the Intel deck
// Must have a lock
func (g *Game) IntelDeckDrawHand() IntelCards {
	count := 5
	if g.GameType == MoleGame {
		count = 6
	}
	d, n := g.IntelDeck.Draw(count)
	g.IntelDeck = n
	return d
}

// GetPlayer returns the id of the index specified
func (g *Game) GetPlayer(idx int) string {
	if idx >= len(g.PlayerIds) {
		return "Undefined"
	}
	return g.PlayerIds[idx]
}

// GetToken returns the token for the named player
func (g *Game) GetToken(player string) string {
	if len(g.PlayerIds) > 0 && g.PlayerIds[0] == player && len(g.PlayerTokens) > 0 {
		return g.PlayerTokens[0]
	}
	if len(g.PlayerIds) > 1 && g.PlayerIds[1] == player && len(g.PlayerTokens) > 1 {
		return g.PlayerTokens[1]
	}
	return "Undefined"
}

// JoinGame adds the second player to the game
func (g *Game) JoinGame(player, token string) error {
	g.lock.Lock()
	defer g.lock.Unlock()

	if g.State != GameJoining {
		return fmt.Errorf("game full")
	}
	if g.PlayerIds[0] == player {
		return fmt.Errorf("already in this game")
	}
	g.PlayerIds = append(g.PlayerIds, player)
	g.PlayerTokens = append(g.PlayerTokens, token)
	g.State = GamePlaying
	return nil
}

// GetPlayers returns the player index of the players.
// returns an error if the player isn't present or the token doesn't match
// requires game lock to be held
func (g *Game) GetPlayers(player, token string) (int, int, error) {
	var p1, p2 int
	if g.GetPlayer(0) == player {
		p1 = 0
		p2 = 1
		if g.PlayerTokens[0] != token {
			return p1, p2, fmt.Errorf("player token not correct")
		}
	} else if g.GetPlayer(1) == player {
		p1 = 1
		p2 = 2
		if g.PlayerTokens[1] != token {
			return p1, p2, fmt.Errorf("player token not correct")
		}
	} else {
		return -1, -1, fmt.Errorf("player not in game")
	}
	return p1, p2, nil
}
