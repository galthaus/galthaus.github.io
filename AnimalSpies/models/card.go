package models

import (
	"fmt"
	"math/rand"
	"sort"
	"strings"
)

type AgentCards []Agent

func AgentDeck() AgentCards {
	c := make(AgentCards, 6)
	for agent := Lion; agent < Mole; agent++ {
		c[int(agent)-1] = agent
	}
	return c
}

func (c AgentCards) Shuffle() {
	rand.Shuffle(len(c), func(i, j int) { c[i], c[j] = c[j], c[i] })
}

func (c AgentCards) Draw(n int) (AgentCards, AgentCards) {
	answer := c[0:n]
	c = c[n:]
	return answer, c
}

func (c AgentCards) String() string {
	cs := make([]string, len(c))
	for i, a := range c {
		cs[i] = a.String()
	}
	return strings.Join(cs, ",")
}

type IntelCards []IntelCard

func (c IntelCards) Shuffle() {
	rand.Shuffle(len(c), func(i, j int) { c[i], c[j] = c[j], c[i] })
}

func (c IntelCards) Draw(n int) (IntelCards, IntelCards) {
	answer := c[0:n]
	c = c[n:]
	return answer, c
}

func (c IntelCards) Sort() {
	sort.Sort(c)
}

func (c IntelCards) Less(ii, jj int) bool {
	return c[ii].Compare(c[jj]) == -1
}

func (c IntelCards) Len() int {
	return len(c)
}

func (c IntelCards) Swap(ii, jj int) {
	c[ii], c[jj] = c[jj], c[ii]
}

// Assumes sorted
func (c IntelCards) Compare(o IntelCards) int {
	if len(c) < len(o) {
		return -1
	}
	if len(c) > len(o) {
		return 1
	}

	for i := 0; i < len(c); i++ {
		cc := c[i]
		oo := o[i]
		val := cc.Compare(oo)
		if val == 0 {
			continue
		}
		return val
	}
	return 0
}

func (c IntelCards) String() string {
	cs := make([]string, len(c))
	for i, a := range c {
		cs[i] = a.String()
	}
	return strings.Join(cs, ",")
}

type IntelCard struct {
	Agent  Agent
	Count  int
	Walrus bool `json:",omitempty"`
}

func (ic IntelCard) Compare(o IntelCard) int {
	if ic.Agent < o.Agent {
		return -1
	}
	if ic.Agent > o.Agent {
		return 1
	}
	if ic.Count < o.Count {
		return -1
	}
	if ic.Count > o.Count {
		return 1
	}
	if !ic.Walrus && o.Walrus {
		return -1
	}
	if ic.Walrus && !o.Walrus {
		return 1
	}
	return 0
}

func (ic IntelCard) String() string {
	optional := ""
	if ic.Walrus {
		optional = " 1 Walrus"
	}
	return fmt.Sprintf("%d %s%s", ic.Count, ic.Agent, optional)
}

func BasicDeck(walrus bool) IntelCards {
	c := make(IntelCards, 30)
	for agent := Lion; agent < Mole; agent++ {
		for ii, cnt := range []int{1, 1, 2, 2, 3} {
			c[ii+(int(agent)-1)*5].Agent = agent
			c[ii+(int(agent)-1)*5].Count = cnt
		}
	}
	if walrus {
		for agent := Lion; agent < Mole; agent++ {
			c[(int(agent)-1)*5].Walrus = true
		}
	}
	return c
}

func MoleDeck(walrus bool) IntelCards {
	c := BasicDeck(walrus)
	agent := Mole
	for ii, cnt := range []int{1, 1, 2, 2, 3} {
		c[ii+(int(agent)-1)*5].Agent = agent
		c[ii+(int(agent)-1)*5].Count = cnt
	}
	return c
}
