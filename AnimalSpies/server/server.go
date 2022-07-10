package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"sort"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/sg-gaming/AnimalSpies/v2/models"
)

var games = map[string]*models.Game{}
var gameLock = sync.Mutex{}

func main() {
	r := gin.Default()
	r.GET("/games", ListGames)
	r.GET("/games/:id", ShowGame)
	r.POST("/games", NewGame)
	r.PUT("/games/:id/join", JoinGame)
	r.PUT("/games/:id/split", SplitGame)
	r.PUT("/games/:id/select", SelectGame)
	r.PUT("/games/:id/bet", BetGame)
	r.Run()
}

func ListGames(c *gin.Context) {
	gameLock.Lock()
	defer gameLock.Unlock()

	arrs := make([]string, len(games))
	i := 0
	for key := range games {
		arrs[i] = key
		i++
	}
	sort.Strings(arrs)

	player, token := getPlayerId(c)
	gs := make([]interface{}, len(arrs))
	for i, id := range arrs {
		g := games[id]
		gs[i] = transformGame(player, token, g)
	}

	c.JSON(200, gs)
}

func ShowGame(c *gin.Context) {
	if g, ok := getGame(c); ok {
		player, token := getPlayerId(c)
		c.JSON(200, transformGame(player, token, g))
	} else {
		c.JSON(http.StatusNotFound, "Not Found")
	}
}

func NewGame(c *gin.Context) {
	player, token := getPlayerId(c)
	if player == "" {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("missing player id"))
		return
	}
	if token == "" {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("missing player token"))
		return
	}
	g, e := models.NewGame(models.BasicGame, player, token)
	if e != nil {
		c.JSON(http.StatusInternalServerError, e.Error())
		return
	}
	gameLock.Lock()
	defer gameLock.Unlock()
	games[g.Seed] = g
	g.Print()
	c.JSON(http.StatusCreated, transformGame(player, token, g))
}

func JoinGame(c *gin.Context) {
	player, token := getPlayerId(c)
	if player == "" {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("missing player id"))
		return
	}
	if token == "" {
		c.JSON(http.StatusBadRequest, fmt.Sprintf("missing player token"))
		return
	}
	if g, ok := getGame(c); ok {
		if err := g.JoinGame(player, token); err != nil {
			c.JSON(http.StatusConflict, err.Error())
			return
		}
		token := g.GetToken(player)
		c.JSON(http.StatusOK, transformGame(player, token, g))
	} else {
		c.JSON(http.StatusNotFound, "Not Found")
	}
}

func SplitGame(c *gin.Context) {
	if g, ok := getGame(c); ok {
		player, token := getPlayerId(c)
		data, err := ioutil.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}
		splitData := &models.SplitInfo{}
		err = json.Unmarshal(data, &splitData)
		if err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}
		if err := g.PlayerSplit(player, token, splitData); err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
		} else {
			c.JSON(http.StatusOK, transformGame(player, token, g))
		}
	} else {
		c.JSON(http.StatusNotFound, "Not Found")
	}
}

func SelectGame(c *gin.Context) {
	if g, ok := getGame(c); ok {
		player, token := getPlayerId(c)
		data, err := ioutil.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}

		selectData := &models.SelectInfo{}
		err = json.Unmarshal(data, &selectData)
		if err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}
		if selectData.ChoosePile != 0 && selectData.ChoosePile != 1 {
			c.JSON(http.StatusBadRequest, "choosePile should be 0 or 1")
			return
		}
		if selectData.CardPile != 0 && selectData.CardPile != 1 {
			c.JSON(http.StatusBadRequest, "cardPile should be 0 or 1")
			return
		}
		if err := g.PlayerSelected(player, token, selectData); err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
		} else {
			c.JSON(http.StatusOK, transformGame(player, token, g))
		}
	} else {
		c.JSON(http.StatusNotFound, "Not Found")
	}
}

func BetGame(c *gin.Context) {
	if g, ok := getGame(c); ok {
		player, token := getPlayerId(c)
		data, err := ioutil.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}
		betData := &models.BetInfo{}
		err = json.Unmarshal(data, &betData)
		if err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
			return
		}
		if betData.Identity < models.Lion && betData.Identity > models.Cameleon {
			c.JSON(http.StatusBadRequest, "agentId Must be 1-6")
			return
		}
		if betData.Bet < 1 || betData.Bet > 3 {
			c.JSON(http.StatusBadRequest, "agentAmount should be between 1 and 3 inclusively")
			return
		}
		if err := g.PlayerBet(player, token, betData); err != nil {
			c.JSON(http.StatusBadRequest, err.Error())
		} else {
			c.JSON(http.StatusOK, transformGame(player, token, g))
		}
	} else {
		c.JSON(http.StatusNotFound, "Not Found")
	}
}

func getPlayerId(c *gin.Context) (player, token string) {
	player = c.Query("player")
	token = c.Query("token")
	return
}

func getGame(c *gin.Context) (*models.Game, bool) {
	gameLock.Lock()
	defer gameLock.Unlock()
	g, ok := games[c.Param("id")]
	return g, ok
}

func transformGame(player, token string, g *models.Game) *models.GameListEntry {
	gl := &models.GameListEntry{Seed: g.Seed, State: g.State, Players: g.PlayerIds}
	p1, _, err := g.GetPlayers(player, token)
	if err == nil {
		gl.Info = g.Players[p1]
	}
	if g.State == models.GameFinished {
		gl.Scores = []int{g.Players[0].Score, g.Players[1].Score}
		if g.Players[0].Score > g.Players[1].Score {
			gl.Winner = g.PlayerIds[0]
		} else if g.Players[0].Score < g.Players[1].Score {
			gl.Winner = g.PlayerIds[1]
		} else {
			gl.Winner = "Tied - for now"
		}
	}
	return gl
}
