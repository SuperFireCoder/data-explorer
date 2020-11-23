import { ComponentProps } from "react";
import { Header as EcHeader } from "@ecocommons-australia/ui-library";
import SignInOutButton from "./SignInOutButton";

// This <Header /> injects the <SignInOutButton /> specific to this site

export default function Header(props: ComponentProps<typeof EcHeader>) {
    return <EcHeader signInOutButton={<SignInOutButton />} {...props} />;
}
