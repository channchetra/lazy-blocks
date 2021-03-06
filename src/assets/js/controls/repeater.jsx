import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';

const { __ } = wp.i18n;
const { Component } = wp.element;
const {
    BaseControl,
    Button,
    Tooltip,
    ToggleControl,
} = wp.components;

const {
    withInstanceId,
} = wp.compose;

const DragHandle = SortableHandle( () => (
    <Button
        className="lzb-gutenberg-repeater-btn-drag"
        onClick={ ( e ) => {
            e.stopPropagation();
        } }
        role="button"
    >
        <span className="dashicons dashicons-menu"></span>
    </Button>
) );

const SortableItem = SortableElement( ( data ) =>
    <div className="lzb-gutenberg-repeater-item">
        <button
            className={ 'lzb-gutenberg-repeater-btn' + ( data.active ? ' lzb-gutenberg-repeater-btn-active' : '' ) }
            onClick={ data.onToggle }
        >
            { data.title }
            <DragHandle />
            <span className="lzb-gutenberg-repeater-btn-arrow dashicons dashicons-arrow-right-alt2" />
        </button>
        { ! data.controlData.rows_min || data.count > data.controlData.rows_min ? (
            <button className="lzb-gutenberg-repeater-btn-remove" onClick={ data.onRemove }><span className="dashicons dashicons-no-alt" /></button>
        ) : '' }
        { data.active ? data.renderContent() : '' }
    </div>
);
const SortableList = SortableContainer( ( { items } ) => {
    return (
        <div className="lzb-gutenberg-repeater-items">
            { items.map( ( value, index ) => (
                <SortableItem key={ `repeater-item-${ index }` } index={ index } { ...value } />
            ) ) }
        </div>
    );
} );

class RepeaterControl extends Component {
    constructor() {
        super( ...arguments );

        const {
            controlData,
        } = this.props;

        this.sortRef = wp.element.createRef();

        let activeItem = -1;

        if ( 'false' === controlData.rows_collapsible ) {
            activeItem = -2;
        } else if ( 'false' === controlData.rows_collapsed ) {
            activeItem = -2;
        }

        this.state = {
            activeItem,
        };

        this.getRowTitle = this.getRowTitle.bind( this );
    }

    componentDidMount() {
        const {
            count = 0,
            controlData,
            addRow = () => {},
        } = this.props;

        // add rows to meet Minimum requirements
        if ( controlData.rows_min && controlData.rows_min > 0 && controlData.rows_min > count ) {
            const needToAdd = controlData.rows_min - count;

            for ( let i = 0; i < needToAdd; i++ ) {
                addRow();
            }
        }
    }

    getRowTitle( i ) {
        const {
            controlData,
            getInnerControls = () => {},
        } = this.props;

        let title = controlData.rows_label || __( 'Row {{#}}' );

        // add row number.
        title = title.replace( /{{#}}/g, i + 1 );

        const innerControls = getInnerControls( i );

        // add inner controls values.
        if ( innerControls ) {
            Object.keys( innerControls ).forEach( ( k ) => {
                const val = innerControls[ k ].val || '';
                const data = innerControls[ k ].data;

                title = title.replace( new RegExp( `{{${ data.name }}}`, 'g' ), val );
            } );
        }

        return title;
    }

    render() {
        const {
            label,
            count = 0,
            controlData,
            renderRow = () => {},
            addRow = () => {},
            removeRow = () => {},
            resortRow = () => {},
        } = this.props;

        const items = [];
        for ( let i = 0; i < count; i++ ) {
            const active = this.state.activeItem === -2 || this.state.activeItem === i;

            items.push( {
                title: this.getRowTitle( i ),
                active: active,
                count,
                controlData,
                onToggle: ( e ) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if ( 'true' === controlData.rows_collapsible ) {
                        this.setState( { activeItem: active ? -1 : i } );
                    }
                },
                onRemove: ( e ) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeRow( i );
                },
                renderContent: () => {
                    return (
                        <div className="lzb-gutenberg-repeater-item-content">
                            { renderRow( i ) }
                        </div>
                    );
                },
            } );
        }

        return (
            <BaseControl label={ label }>
                <div className="lzb-gutenberg-repeater">
                    { items.length ? (
                        <SortableList
                            ref={ this.sortRef }
                            items={ items }
                            onSortEnd={ ( { oldIndex, newIndex } ) => {
                                resortRow( oldIndex, newIndex );

                                if ( this.state.activeItem > -1 ) {
                                    this.setState( { activeItem: newIndex } );
                                }
                            } }
                            useDragHandle={ true }
                            helperContainer={ () => {
                                if ( this.sortRef && this.sortRef.current && this.sortRef.current.container ) {
                                    return this.sortRef.current.container;
                                }

                                return document.body;
                            } }
                        />
                    ) : '' }
                    <div className="lzb-gutenberg-repeater-options">
                        <Button
                            isDefault={ true }
                            disabled={ controlData.rows_max && count >= controlData.rows_max }
                            onClick={ () => {
                                addRow();
                            } }
                        >
                            { controlData.rows_add_button_label || __( '+ Add Row' ) }
                        </Button>
                        { 'true' === controlData.rows_collapsible && items.length && items.length > 1 ? (
                            <Tooltip text={ __( 'Toggle all rows' ) }>
                                <div>
                                    { /* For some reason Tooltip is not working without this <div> */ }
                                    <ToggleControl
                                        checked={ this.state.activeItem === -2 ? true : false }
                                        onChange={ () => {
                                            this.setState( { activeItem: this.state.activeItem === -2 ? -1 : -2 } );
                                        } }
                                    />
                                </div>
                            </Tooltip>
                        ) : '' }
                    </div>
                </div>
            </BaseControl>
        );
    }
}

export default withInstanceId( RepeaterControl );
