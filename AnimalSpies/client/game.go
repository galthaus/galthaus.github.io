package main

import (
	"fmt"
	"strconv"

	"github.com/sg-gaming/AnimalSpies/v2/models"
	"github.com/spf13/cobra"
)

func init() {
	addRegistrar(registerGame)
}

func registerGame(app *cobra.Command) {
	games := &cobra.Command{
		Use:   "games",
		Short: "Access Animal Spies Games",
	}

	list := &cobra.Command{
		Use:   "list",
		Short: "list the games on the server",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 0 {
				return fmt.Errorf("%v requires 0 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			games, err := Session.ListGames()
			if err != nil {
				return err
			}
			return prettyPrint(games)
		},
	}
	games.AddCommand(list)
	show := &cobra.Command{
		Use:   "show <gid>",
		Short: "Show the specific game on the server",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 1 {
				return fmt.Errorf("%v requires 1 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			game, err := Session.GetGame(args[0])
			if err != nil {
				return err
			}
			return prettyPrint(game)
		},
	}
	games.AddCommand(show)
	create := &cobra.Command{
		Use:   "create",
		Short: "Create a game",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 0 {
				return fmt.Errorf("%v requires 0 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			game, err := Session.CreateGame()
			if err != nil {
				return err
			}
			return prettyPrint(game)
		},
	}
	games.AddCommand(create)
	join := &cobra.Command{
		Use:   "join",
		Short: "Join a game",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 1 {
				return fmt.Errorf("%v requires 1 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			game, err := Session.JoinGame(args[0])
			if err != nil {
				return err
			}
			return prettyPrint(game)
		},
	}
	games.AddCommand(join)

	splitList := &cobra.Command{
		Use:   "splitList <game id>",
		Short: "splitList generates a set of options for splitting.",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 1 {
				return fmt.Errorf("%v requires 1 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			game, err := Session.GetGame(args[0])
			if err != nil {
				return err
			}
			splitOpts := game.SplitOptions()
			game.Info.Hand.Sort()
			fmt.Printf("Hand: %s\n", game.Info.Hand.String())
			for i, opt := range splitOpts {
				fmt.Printf("%d - ", i)
				opt.Print()
			}
			return nil
		},
	}
	games.AddCommand(splitList)

	split := &cobra.Command{
		Use:   "split <game id> #",
		Short: "split piles into the right pieces.",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 2 {
				return fmt.Errorf("%v requires 2 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			game, err := Session.GetGame(args[0])
			if err != nil {
				return err
			}
			splitOpts := game.SplitOptions()
			idx, err := strconv.Atoi(args[1])
			if err != nil {
				return err
			}
			if idx >= len(splitOpts) || idx < 0 {
				return fmt.Errorf("Invalid spilt index: %d", idx)
			}
			game, err = Session.SplitGame(args[0], splitOpts[idx])
			if err != nil {
				return err
			}
			return prettyPrint(game)
		},
	}
	games.AddCommand(split)

	sel := &cobra.Command{
		Use:   "select <game id> <choosen pile #> <card pile #>",
		Short: "select pile and where card should go.  (0, 1)",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 3 {
				return fmt.Errorf("%v requires 3 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			bi := &models.SelectInfo{}

			ai, err := strconv.Atoi(args[1])
			if err != nil {
				return err
			}
			bet, err := strconv.Atoi(args[2])
			if err != nil {
				return err
			}

			bi.ChoosePile = ai
			bi.CardPile = bet
			game, err := Session.SelectGame(args[0], bi)
			if err != nil {
				return err
			}
			return prettyPrint(game)
		},
	}
	games.AddCommand(sel)

	bet := &cobra.Command{
		Use:   "bet <game id> <identity #> <bet #>",
		Short: "bet a game",
		Args: func(c *cobra.Command, args []string) error {
			if len(args) != 3 {
				return fmt.Errorf("%v requires 3 arguments", c.UseLine())
			}
			return nil
		},
		RunE: func(c *cobra.Command, args []string) error {
			bi := &models.BetInfo{}

			ai, err := strconv.Atoi(args[1])
			if err != nil {
				return err
			}
			bet, err := strconv.Atoi(args[2])
			if err != nil {
				return err
			}

			bi.Identity = models.Agent(ai)
			bi.Bet = bet
			game, err := Session.BetGame(args[0], bi)
			if err != nil {
				return err
			}
			return prettyPrint(game)
		},
	}
	games.AddCommand(bet)

	app.AddCommand(games)
}
