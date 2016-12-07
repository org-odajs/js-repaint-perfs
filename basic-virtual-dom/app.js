var h = basicVirtualDom.h;
var diff = basicVirtualDom.diff;
var patch = basicVirtualDom.patch;

var dom = h('table', null, '');
var dbmon = document.getElementById('dbmon');

dbmon.appendChild(dom.render());

var update = function() {
  var data = ENV.generateData().toArray();

  /**
   * Lets it happen
   */

  var table = h('table', { className : 'table table-striped latest-data'}, h('tbody', null, ''));
  table.children[0].children = [];

  for (var i = 0; i < data.length; i++) {
    var db = data[i];

    var line = h('tr', null,
      h('td', { className : 'dbname' }, db.dbname),
      h('td', { className : 'query-count'}, 
        h('span', { className : db.lastSample.countClassName }, db.lastSample.nbQueries)
      )
    );

    for (var j = 0; j < db.lastSample.topFiveQueries.length; j++) {
      var q = db.lastSample.topFiveQueries[j];

      var stats = h('td', { className : q.elapsedClassName }, q.formatElapsed || '',
        h('div', { className : 'popover left' }, 
          h('div', { className : 'popover-content' }, q.query || ''),
          h('div', { className : 'arrow' }, '')
        )
      );

      line.children.push(stats);
    }

    table.children[0].children.push(line);
  }

  patch(dom, diff(dom, table));

  Monitoring.renderRate.ping();
  setTimeout(update, ENV.timeout);
};

update();
