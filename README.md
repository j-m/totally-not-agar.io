![Logo](https://github.com/jauntum/TotallyNotAgario/blob/master/NottHackApp/public/images/TNA.png "Logo")

## [![Travis](https://travis-ci.org/jauntum/TotallyNotAgario.svg)](https://travis-ci.org/jauntum/TotallyNotAgario) Totally NOT Agar.io - Nottingham University Hackathon 2017

At HackNotts 2017 our project was a clone of Agar.io.
This repo is an independent continuation of the project - which I hope to refine and optimise.
Since the Hackathon I have rebuilt everything from the ground up and expanded features.

The server manipulates all data, leaving nothing to the client and thus preventing cheaters. 
Unfortunately, this means that you need a beefy CPU if you want it to actually be multiplayer.
To fix this I'm considering:
- Decreasing the time complexity by using more memory
- Reducing event-based communication
- Delaying non-essential data transmission
- Using different web socket packages. (I have already changed from `socket.io` to `ws`)

Please bear in my I've kept this project as NO LICENSE as I do not own the rights to this idea. 
If you wish to use any code from here, please check ![agar.io](http://agar.io) for their license first before asking me in Issues. 
