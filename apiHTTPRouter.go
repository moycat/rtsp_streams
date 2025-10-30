package main

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// Message resp struct
type Message struct {
	Status  int         `json:"status"`
	Payload interface{} `json:"payload"`
}

// HTTPAPIServer start http server routes
func HTTPAPIServer() {
	//Set HTTP API mode
	log.WithFields(logrus.Fields{
		"module": "http_server",
		"func":   "RTSPServer",
		"call":   "Start",
	}).Infoln("Server HTTP start")
	var public *gin.Engine
	if !Storage.ServerHTTPDebug() {
		gin.SetMode(gin.ReleaseMode)
		public = gin.New()
	} else {
		gin.SetMode(gin.DebugMode)
		public = gin.Default()
	}

	public.Use(CrossOrigin())

	/*
		Static HTML Files Demo Mode
	*/

	if Storage.ServerHTTPDemo() {
		public.LoadHTMLGlob(Storage.ServerHTTPDir() + "/templates/*")
		public.GET("/", HTTPAPIServerIndex)
		public.GET("/pages/player/hls/:uuid/:channel", HTTPAPIPlayHls)
		public.GET("/pages/multiview", HTTPAPIMultiview)
		public.Any("/pages/multiview/full", HTTPAPIFullScreenMultiView)
		public.GET("/pages/documentation", HTTPAPIServerDocumentation)
		public.StaticFS("/static", http.Dir(Storage.ServerHTTPDir()+"/static"))
	}

	/*
		Stream video elements
	*/
	//HLS
	public.GET("/stream/:uuid/channel/:channel/hls/live/index.m3u8", HTTPAPIServerStreamHLSM3U8)
	public.GET("/stream/:uuid/channel/:channel/hls/live/segment/:seq/file.ts", HTTPAPIServerStreamHLSTS)
	//HLS remote record
	//public.GET("/stream/:uuid/channel/:channel/hls/rr/:s/:e/index.m3u8", HTTPAPIServerStreamRRM3U8)
	//public.GET("/stream/:uuid/channel/:channel/hls/rr/:s/:e/:seq/file.ts", HTTPAPIServerStreamRRTS)
	//HLS LL
	public.GET("/stream/:uuid/channel/:channel/hlsll/live/index.m3u8", HTTPAPIServerStreamHLSLLM3U8)
	public.GET("/stream/:uuid/channel/:channel/hlsll/live/init.mp4", HTTPAPIServerStreamHLSLLInit)
	public.GET("/stream/:uuid/channel/:channel/hlsll/live/segment/:segment/:any", HTTPAPIServerStreamHLSLLM4Segment)
	public.GET("/stream/:uuid/channel/:channel/hlsll/live/fragment/:segment/:fragment/:any", HTTPAPIServerStreamHLSLLM4Fragment)
	//Save fragment to mp4
	public.GET("/stream/:uuid/channel/:channel/save/mp4/fragment/:duration", HTTPAPIServerStreamSaveToMP4)
	err := public.Run(Storage.ServerHTTPPort())
	if err != nil {
		log.WithFields(logrus.Fields{
			"module": "http_router",
			"func":   "HTTPAPIServer",
			"call":   "ServerHTTPPort",
		}).Fatalln(err.Error())
		os.Exit(1)
	}

}

// HTTPAPIServerIndex index file
func HTTPAPIServerIndex(c *gin.Context) {
	c.HTML(http.StatusOK, "index.tmpl", gin.H{
		"port":    Storage.ServerHTTPPort(),
		"streams": Storage.Streams,
		"version": time.Now().String(),
		"page":    "index",
	})

}

func HTTPAPIServerDocumentation(c *gin.Context) {
	c.HTML(http.StatusOK, "documentation.tmpl", gin.H{
		"port":    Storage.ServerHTTPPort(),
		"streams": Storage.Streams,
		"version": time.Now().String(),
		"page":    "documentation",
	})
}

func HTTPAPIPlayHls(c *gin.Context) {
	c.HTML(http.StatusOK, "play_hls.tmpl", gin.H{
		"port":    Storage.ServerHTTPPort(),
		"streams": Storage.Streams,
		"version": time.Now().String(),
		"page":    "play_hls",
		"uuid":    c.Param("uuid"),
		"channel": c.Param("channel"),
	})
}

func HTTPAPIMultiview(c *gin.Context) {
	c.HTML(http.StatusOK, "multiview.tmpl", gin.H{
		"port":    Storage.ServerHTTPPort(),
		"streams": Storage.Streams,
		"version": time.Now().String(),
		"page":    "multiview",
	})
}

type MultiViewOptions struct {
	Grid   int                             `json:"grid"`
	Player map[string]MultiViewOptionsGrid `json:"player"`
}
type MultiViewOptionsGrid struct {
	UUID       string `json:"uuid"`
	Channel    int    `json:"channel"`
	PlayerType string `json:"playerType"`
}

func HTTPAPIFullScreenMultiView(c *gin.Context) {
	var createParams MultiViewOptions
	err := c.ShouldBindJSON(&createParams)
	if err != nil {
		log.WithFields(logrus.Fields{
			"module": "http_page",
			"func":   "HTTPAPIFullScreenMultiView",
			"call":   "BindJSON",
		}).Errorln(err.Error())
	}
	log.WithFields(logrus.Fields{
		"module": "http_page",
		"func":   "HTTPAPIFullScreenMultiView",
		"call":   "Options",
	}).Debugln(createParams)
	c.HTML(http.StatusOK, "fullscreenmulti.tmpl", gin.H{
		"port":    Storage.ServerHTTPPort(),
		"streams": Storage.Streams,
		"version": time.Now().String(),
		"options": createParams,
		"page":    "fullscreenmulti",
		"query":   c.Request.URL.Query(),
	})
}

// CrossOrigin Access-Control-Allow-Origin any methods
func CrossOrigin() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
