/** @jsx h */

var h = cake.h, create = cake.create, Cream = cake.Cream;

create({
  element : document.getElementById('dbmon')
}).route('*', 'dbmon');

Cream.extend({
  _namespace : 'dbmon',
  databases : [],

  loadSamples : function() {
    this.set('databases', ENV.generateData().toArray());
    Monitoring.renderRate.ping();
    setTimeout(this.loadSamples, ENV.timeout);
  },

  init : function() {
    this.loadSamples();
  },

  render : function() {
    return (
      <table className="table table-striped latest-data">
          <tbody>
            { 
              this.databases.map(function(database) {
                return (
                  <tr key={database.dbname}>
                    <td className="dbname">
                      {database.dbname}
                    </td>
                    <td className="query-count">
                      <span className={database.lastSample.countClassName}>
                        {database.lastSample.nbQueries}
                      </span>
                    </td>
                    { database.lastSample.topFiveQueries.map(function(query, index) {
                        return (
                          <td className={ "Query " + query.elapsedClassName}>
                            {query.formatElapsed}
                            <div className="popover left">
                              <div className="popover-content">{query.query}</div>
                              <div className="arrow"/>
                            </div>
                          </td>
                        );
                    })}
                  </tr>
                );
              })
            }
          </tbody>
        </table>
    );
  }

});

