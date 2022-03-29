import * as React from 'preact';
import { runBenchmark } from './runner.js';
const { Component, render } = React;
class XThing extends Component {
    render() {
        return (React.createElement("x-thing", null,
            React.createElement("div", { class: "container style-scope x-thing" },
                React.createElement("div", { class: "from style-scope x-thing" }, this.props.from),
                React.createElement("div", { class: "time style-scope x-thing" }, this.props.time),
                React.createElement("div", { class: "subject style-scope x-thing" }, this.props.subject),
                React.createElement("div", { class: "style-scope x-thing" },
                    "slotted: ",
                    this.props.children))));
    }
}
class XItem extends Component {
    render() {
        return (React.createElement("x-item", null,
            React.createElement("div", { onClick: () => this.onClick(), class: "item style-scope x-item" },
                React.createElement(XThing, { from: this.props.item.value0, time: this.props.item.value1, subject: this.props.item.value2 },
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value0),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value1),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value2)),
                React.createElement(XThing, { from: this.props.item.value3, time: this.props.item.value4, subject: this.props.item.value5 },
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value3),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value4),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value5)),
                React.createElement(XThing, { from: this.props.item.value6, time: this.props.item.value7, subject: this.props.item.value8 },
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value6),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value7),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value8)),
                React.createElement(XThing, { from: this.props.item.value9, time: this.props.item.value10, subject: this.props.item.value11 },
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value9),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value10),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value11)),
                React.createElement(XThing, { from: this.props.item.value12, time: this.props.item.value13, subject: this.props.item.value14 },
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-$",
                        this.props.item.value12),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-$",
                        this.props.item.value13),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-$",
                        this.props.item.value14)),
                React.createElement(XThing, { from: this.props.item.value15, time: this.props.item.value16, subject: this.props.item.value17 },
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value15),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value16),
                    React.createElement("div", { class: "style-scope x-item" },
                        "s-",
                        this.props.item.value17)))));
    }
    onClick() {
        console.log('click');
    }
}
class XApp extends Component {
    render() {
        return (React.createElement("x-app", null, this.props.items.map((item) => React.createElement(XItem, { item: item }))));
    }
}
const updateComplete = () => new Promise((r) => requestAnimationFrame(r));
const renderApp = async (data) => {
    render(React.createElement(XApp, { items: data }), document.body);
    await updateComplete();
};
runBenchmark(renderApp);
//# sourceMappingURL=index-preact.js.map