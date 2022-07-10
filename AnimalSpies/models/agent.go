package models

import "fmt"

type Agent int

const (
	// since iota starts with 0, the first value
	// defined here will be the default
	Undefined Agent = iota
	Lion
	Fox
	Owl
	Octopus
	Monkey
	Cameleon
	Mole
)

func (a Agent) String() string {
	switch a {
	case Lion:
		return "Lion"
	case Fox:
		return "Fox"
	case Owl:
		return "Owl"
	case Octopus:
		return "Octopus"
	case Monkey:
		return "Monkey"
	case Cameleon:
		return "Cameleon"
	case Mole:
		return "Mole"
	}
	return fmt.Sprintf("Undefined:%d", a)
}
