/*
 Introduction to Computer Graphics: a Practical Learning Approach
F. Ganovelli, M. Corsini, S. Pattanaik, M. Di Benedetto

How to use the code provided with the book
*/


=== How to modify the clients ===

One uncompressed, see the following folders and files:

nvmc
--chapter2
--chapter3
--chapter4
--chapter5
--chapter6
--chapter7
--chapter9
--chapter10
--lib
--media
--media_remote
--globals.js
--readme.txt
--style.css


Each folder contains the client introduced in the corresponding chapter of the book. Each client is 
inside a numbered folder, for example:

chapter2
--0
----0.html
----0.js
----shaders.js

There are two ways to run the client in your machine:

1. WITH A LOCAL WEB SERVER
If you have a local webserver, then all you have to do is to set the document root to "nvmc". Then you can type in your web-enabled browser:

localhost/chapter2/0/0.html


2. WITHOUT A LOCAL WEB SERVER
If you do not have a local web server then you must uncomment the last line of file globals.js. This will prefix a string containing a url
to the remote server  where to load  resources (geometry and textures)

In this case you can just open directly any client file (like chapter2/0/0.html) and it's done. 

NOTE: if you are NOT connected to the internet and you have NOT a web server installed, you can still directly open the html files with the browser,
but clients after chapter5/0 won't work poperly because they need geoemtry models and textures.


=== Tools for developing ===
In principle you only need a text editor








