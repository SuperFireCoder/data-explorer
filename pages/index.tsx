import FixedContainer from "../components/FixedContainer";
import Header from "../components/Header";
import HtmlHead from "../components/HtmlHead";

export default function Index() {
    return (
        <>
            <HtmlHead />
            <Header />
            <FixedContainer>
                <h1>Hello</h1>
                <h2>Hello</h2>
                <h3>Hello</h3>
                <h4>Hello</h4>
                <h5>Hello</h5>
                <h6>Hello</h6>
            </FixedContainer>
        </>
    );
}
