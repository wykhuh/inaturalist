import _ from "lodash";
import React, { PropTypes } from "react";
import UsersPopover from "./users_popover";

class QualityMetrics extends React.Component {
  constructor( ) {
    super( );
    this.voteCellsForMetric = this.voteCellsForMetric.bind( this );
    this.openFlaggingModal = this.openFlaggingModal.bind( this );
    this.flaggingDiv = this.flaggingDiv.bind( this );
  }

  voteCell( metric, isAgree, isMajority, className, usersChoice, voters, loading, disabled ) {
    let votesCount = loading ? (
      <div className="loading_spinner" /> ) : (
      <UsersPopover
        users={ voters }
        keyPrefix={ `metric-${metric}` }
        contents={ ( <span>({voters.length})</span> ) }
      /> );
    return (
      <span>
        <span className="check">
          { isMajority ? (
            <i className="fa fa-check" />
          ) : null }
        </span>
        <i className={ `fa ${className}` } onClick={ () => {
          if ( disabled ) { return; }
          if ( usersChoice ) {
            this.props.unvoteMetric( metric );
          } else {
            if ( isAgree ) {
              this.props.voteMetric( metric );
            } else {
              this.props.voteMetric( metric, { agree: "false" } );
            }
          }
        } }
        />
        <span className="count">{ votesCount }</span>
      </span>
    );
  }

  needsIDInputs( ) {
    const needsIDInfo = this.infoForMetric( "needs_id" );
    let votesForCount = needsIDInfo.voteForLoading ? (
      <div className="loading_spinner" /> ) : (
      <UsersPopover
        users={ needsIDInfo.votersFor }
        keyPrefix="metric-needs_id-agree"
        contents={ ( <span>({needsIDInfo.votersFor.length})</span> ) }
      /> );
    let votesAgainstCount = needsIDInfo.voteAgainstLoading ? (
      <div className="loading_spinner" /> ) : (
      <UsersPopover
        users={ needsIDInfo.votersAgainst }
        keyPrefix="metric-needs_id-disagree"
        contents={ ( <span>({needsIDInfo.votersAgainst.length})</span> ) }
      /> );
    return (
      <div className="inputs">
        <div className="yes">
          <input type="checkbox" id="improveYes"
            disabled={ needsIDInfo.loading }
            checked={ needsIDInfo.userVotedFor }
            onChange={ () => {
              if ( needsIDInfo.userVotedFor ) {
                this.props.unvoteMetric( "needs_id" );
              } else {
                this.props.voteMetric( "needs_id" );
              }
            } }
          />
          <label htmlFor="improveYes" className={ needsIDInfo.mostAgree ? "bold" : "" }>
            Yes { votesForCount }
          </label>
        </div>
        <div className="no">
          <input type="checkbox" id="improveNo"
            disabled={ needsIDInfo.loading }
            checked={ needsIDInfo.userVotedAgainst }
            onChange={ () => {
              if ( needsIDInfo.userVotedAgainst ) {
                this.props.unvoteMetric( "needs_id" );
              } else {
                this.props.voteMetric( "needs_id", { agree: "false" } );
              }
            } }
          />
          <label htmlFor="improveNo" className={ needsIDInfo.mostDisagree ? "bold" : "" }>
            No, it's as good as it can be { votesAgainstCount }
          </label>
        </div>
      </div>
    );
  }

  infoForMetric( metric ) {
    const votersFor = [];
    const votersAgainst = [];
    let userVotedFor;
    let userVotedAgainst;
    let voteForLoading;
    let voteAgainstLoading;
    const config = this.props.config;
    const loggedIn = config && config.currentUser;
    _.each( this.props.qualityMetrics[metric], m => {
      const agree = ( "vote_scope" in m ) ? m.vote_flag : m.agree;
      if ( agree ) {
        votersFor.push( m.user );
        if ( m.api_status ) { voteForLoading = true; }
      } else {
        votersAgainst.push( m.user );
        if ( m.api_status ) { voteAgainstLoading = true; }
      }
      if ( loggedIn && m.user.id === config.currentUser.id ) {
        userVotedFor = agree;
        userVotedAgainst = !agree;
      }
    } );
    const agreeClass = userVotedFor ? "fa-thumbs-up" : "fa-thumbs-o-up";
    const disagreeClass = userVotedAgainst ? "fa-thumbs-down" : "fa-thumbs-o-down";
    let mostAgree = votersFor.length > votersAgainst.length;
    const mostDisagree = votersAgainst.length > votersFor.length;
    if ( _.isEmpty( this.props.qualityMetrics[metric] ) ) {
      mostAgree = true;
    }
    return {
      mostAgree,
      mostDisagree,
      agreeClass,
      disagreeClass,
      userVotedFor,
      userVotedAgainst,
      votersFor,
      votersAgainst,
      voteForLoading,
      voteAgainstLoading,
      loading: ( voteForLoading || voteAgainstLoading )
    };
  }

  voteCellsForMetric( metric ) {
    const info = this.infoForMetric( metric );
    return {
      agreeCell: this.voteCell(
        metric, true, info.mostAgree, info.agreeClass, info.userVotedFor,
        info.votersFor, info.voteForLoading, info.loading ),
      disagreeCell: this.voteCell(
        metric, false, info.mostDisagree, info.disagreeClass, info.userVotedAgainst,
        info.votersAgainst, info.voteAgainstLoading, info.loading ),
      loading: info.loading
    };
  }

  openFlaggingModal( ) {
    this.props.setFlaggingModalState( "item", this.props.observation );
    this.props.setFlaggingModalState( "show", true );
  }

  flaggingDiv( ) {
    const observation = this.props.observation;
    if ( observation.flags.length > 0 ) {
      const groupedFlags = _.groupBy( observation.flags, f => ( f.flag ) );
      let flagQualifier;
      if ( groupedFlags.spam ) {
        flagQualifier = "spam";
      } else if ( groupedFlags.inappropriate ) {
        flagQualifier = "inappropriate";
      }
      return (
        <div className="flagging alert alert-danger">
          <i className="fa fa-flag" />
          Observation flagged{ flagQualifier ? ` as ${flagQualifier}` : "" }
          <a href={ `/observations/${observation.id}/flags` } className="view">
            Add/Edit Flags
          </a>
        </div>
      );
    }
    return (
      <div className="flagging">
        Inappropriate content? <span className="flag_link" onClick={ this.openFlaggingModal }>
          Flag as inappropriate
        </span>
      </div>
    );
  }

  render( ) {
    const observation = this.props.observation;
    const checkIcon = ( <i className="fa fa-check check" /> );
    const hasMedia = ( observation.photos.length + observation.sounds.length ) > 0;
    const atLeastSpecies = ( observation.taxon && observation.taxon.rank_level <= 10 );
    const mostAgree = observation.identifications_most_agree;
    const wildCells = this.voteCellsForMetric( "wild" );
    const locationCells = this.voteCellsForMetric( "location" );
    const dateCells = this.voteCellsForMetric( "date" );
    const evidenceCells = this.voteCellsForMetric( "evidence" );
    const recentCells = this.voteCellsForMetric( "recent" );
    return (
      <div className="QualityMetrics">
        <h3>Data Quality Assessment</h3>
        <div className="grade">
          Quality Grade:
          <span className={ `quality_grade ${observation.quality_grade} ` }>
            { _.upperFirst( I18n.t( observation.quality_grade ) ) }
          </span>
        </div>
        <div className="text">
          The data quality assessment is an evaluation of an observation’s accuracy.
          Research Grade observations may be used by scientists for research. Cast your vote below:
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Research Grade Qualification</th>
              <th className="agree">Yes</th>
              <th className="disagree">No</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="metric_title">
                <i className="fa fa-calendar" />
                Date specified
              </td>
              <td className="agree">{ observation.observed_on ? checkIcon : null }</td>
              <td className="disagree">{ observation.observed_on ? null : checkIcon }</td>
            </tr>
            <tr>
              <td className="metric_title">
                <i className="fa fa-map-marker" />
                Location specified
              </td>
              <td className="agree">{ observation.location ? checkIcon : null }</td>
              <td className="disagree">{ observation.location ? null : checkIcon }</td>
            </tr>
            <tr>
              <td className="metric_title">
                <i className="fa fa-file-image-o" />
                Has photos or sounds
              </td>
              <td className="agree">{ hasMedia ? checkIcon : null }</td>
              <td className="disagree">{ hasMedia ? null : checkIcon }</td>
            </tr>
            <tr>
              <td className="metric_title">
                <i className="fa icon-identification" />
                Has ID supported by two or more
              </td>
              <td className="agree">{ mostAgree ? checkIcon : null }</td>
              <td className="disagree">{ mostAgree ? null : checkIcon }</td>
            </tr>
            <tr>
              <td className="metric_title">
                <i className="fa fa-leaf" />
                Community ID as species level or lower
              </td>
              <td className="agree">{ atLeastSpecies ? checkIcon : null }</td>
              <td className="disagree">{ atLeastSpecies ? null : checkIcon }</td>
            </tr>
            <tr className={ dateCells.loading ? "disabled" : "" }>
              <td className="metric_title">
                <i className="fa fa-calendar-check-o" />
                Date is accurate
              </td>
              <td className="agree">{ dateCells.agreeCell }</td>
              <td className="disagree">{ dateCells.disagreeCell }</td>
            </tr>
            <tr className={ locationCells.loading ? "disabled" : "" }>
              <td className="metric_title">
                <i className="fa fa-bullseye" />
                Location is accurate
              </td>
              <td className="agree">{ locationCells.agreeCell }</td>
              <td className="disagree">{ locationCells.disagreeCell }</td>
            </tr>
            <tr className={ wildCells.loading ? "disabled" : "" }>
              <td className="metric_title">
                <i className="fa fa-bolt" />
                Organism is wild
              </td>
              <td className="agree">{ wildCells.agreeCell }</td>
              <td className="disagree">{ wildCells.disagreeCell }</td>
            </tr>
            <tr className={ evidenceCells.loading ? "disabled" : "" }>
              <td className="metric_title">
                <i className="fa fa-bolt" />
                Evidence of organism
              </td>
              <td className="agree">{ evidenceCells.agreeCell }</td>
              <td className="disagree">{ evidenceCells.disagreeCell }</td>
            </tr>
            <tr className={ recentCells.loading ? "disabled" : "" }>
              <td className="metric_title">
                <i className="fa fa-bolt" />
                Recent evidence of organism
              </td>
              <td className="agree">{ recentCells.agreeCell }</td>
              <td className="disagree">{ recentCells.disagreeCell }</td>
            </tr>
            <tr className="improve">
              <td className="metric_title" colSpan={ 3 }>
                <i className="fa fa-gavel" />
                Based on the evidence, can the Community ID still be confirmed or improved?
                { this.needsIDInputs( ) }
              </td>
            </tr>
          </tbody>
        </table>
        { this.flaggingDiv( ) }
      </div>
    );
  }
}

QualityMetrics.propTypes = {
  config: PropTypes.object,
  observation: PropTypes.object,
  qualityMetrics: PropTypes.object,
  voteMetric: PropTypes.func,
  unvoteMetric: PropTypes.func,
  setFlaggingModalState: PropTypes.func
};

export default QualityMetrics;
