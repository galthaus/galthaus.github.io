package main

import (
	"os"
)

func main() {
	err := NewApp().Execute()
	if err != nil {
		os.Exit(1)
	}
}
