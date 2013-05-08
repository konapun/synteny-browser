This is a sequence region comparison visualization which uses the Scribl HTML5 canvas library (http://chmille4.github.com/Scribl/).
If you'd like to see a screenshot of this library in action, please refer to example/projection.png

![example](https://github.com/konapun/synteny-browser/blob/master/example/projection.png "example")
Files
------
vendor/Scribl.1.1.3.min.js: Library which powers the synteny browser
syntenybrowser.js: The synteny browser
script/blast.sh: Script to use in conjunction with your own 'pairwise_align.php' hosted on your server (this is only required to use the "region.compareWith" function)
example/test.html: Short example of how to use the synteny browser
example/projection.php: Screenshot of the synteny browser used in a production environment

TODO
----
1) Fix upper region hilighting so that it consistently falls on the sequence scale

Credits
-------
Credits to Chase Miller, who created the wonderful Scribl biological charting library,
and to FlyExpress (http://www.flyexpress.net/) for sponsoring development of this project
