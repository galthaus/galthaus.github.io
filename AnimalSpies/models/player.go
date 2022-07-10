package models

import "fmt"

type PlayerState int

const (
	// since iota starts with 0, the first value
	// defined here will be the default
	UndefinedPS PlayerState = iota
	WaitingForSplit
	WaitingForSelect
	WaitingForBetting
	Selecting
	Spliting
	Betting
	Finished
)

func (ps PlayerState) String() string {
	switch ps {
	case WaitingForSelect:
		return "WaitingForSelect"
	case WaitingForSplit:
		return "WaitingForSplit"
	case Spliting:
		return "Spliting"
	case Selecting:
		return "Selecting"
	case Betting:
		return "Betting"
	case WaitingForBetting:
		return "WaitingForBetting"
	case Finished:
		return "Finished"
	}
	return fmt.Sprintf("UndefinedPS:%d", ps)
}

type PlayerInfo struct {
	Identity    Agent
	Spy         Agent
	DoubleAgent Agent
	Intel       IntelCards `json:",omitempty"`

	State          PlayerState
	Hand           IntelCards
	Split          *SplitInfo
	HiddenCardPile int
	BetAgent       Agent `json:",omitempty"`
	BetAmount      int   `json:",omitempty"`

	Score int
}

type SelectInfo struct {
	ChoosePile int
	CardPile   int
}

type BetInfo struct {
	Identity Agent
	Bet      int
}

type SplitInfo struct {
	Pile1      IntelCards
	Pile2      IntelCards
	ChooseCard IntelCard
	Hidden1    IntelCard
	Hidden2    IntelCard
}

func (si *SplitInfo) Print() {
	if si == nil {
		fmt.Printf("  Split: nil\n")
		return
	}
	fmt.Printf("  Split:\n")
	fmt.Printf("     Pile1: %s\n", si.Pile1.String())
	fmt.Printf("     Pile2: %s\n", si.Pile2.String())
	fmt.Printf("     Choose: %s\n", si.ChooseCard.String())
	if si.Hidden1.Agent != Undefined {
		fmt.Printf("     HP1: %s\n", si.Hidden1.String())
	}
	if si.Hidden2.Agent != Undefined {
		fmt.Printf("     HP2: %s\n", si.Hidden2.String())
	}
}

func (pi *PlayerInfo) Print() {
	fmt.Printf("    Score      : %d\n", pi.Score)
	fmt.Printf("    Identity   : %s\n", pi.Identity.String())
	fmt.Printf("    Spy        : %s\n", pi.Spy.String())
	fmt.Printf("    DoubleAgent: %s\n", pi.DoubleAgent.String())
	fmt.Printf("    Intel      : %s\n", pi.Intel.String())
	fmt.Printf("    State      : %s\n", pi.State.String())
	fmt.Printf("    Hand       : %s\n", pi.Hand.String())
	pi.Split.Print()
	if pi.HiddenCardPile != 2 {
		fmt.Printf("    HCP        : %d\n", pi.HiddenCardPile)
	}
	if pi.BetAgent != Undefined {
		fmt.Printf("    Bet Agent  : %s\n", pi.BetAgent.String())
		fmt.Printf("    Bet Amount : %d\n", pi.BetAmount)
	}
}
